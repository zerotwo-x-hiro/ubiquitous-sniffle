// api/admin/build-catalog.js (parallelized, deadline-safe)
//
// ONE-SHOT build helper. Pulls /shows?page=N pages from TVMaze in parallel
// (bounded concurrency so we stay within TVMaze's "20 concurrent burst /
// ~20 req per 10s sustained" guideline), filters to Korean Scripted dramas,
// compacts into a minimal shape, and returns the full catalog in one
// response if there's enough time; otherwise resumes with the next page
// range and a carry.
//
// Call with ?__build=1 (or ?token=BUILD_TOKEN). POST a JSON body with
// {nextPage: N, shows: [...]} to resume.

const BASE = "https://api.tvmaze.com/shows";
const MIN_YEAR = 1990;
const PAGE_BUDGET_MS = 52_000;
const CONCURRENCY = 2;
const PAGE_INTER_PAGE_DELAY_MS = 180;
const MAX_PAGES = 600;

// Global (per-invocation) backoff flag: if one worker sees a 429, every
// worker pauses briefly instead of hammering and compounding 429s.
let globalBackoffUntil = 0;

// In-memory catalog cache (module-level) — survives across warm lambda
// invocations so subsequent ?year= slices (or a retry) don't re-paginate
// all of TVMaze. Invalidated when the lambda cold-starts.
let _cached = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 min

function authorized(url) {
  if (process.env.BUILD_TOKEN) {
    return url.searchParams.get("token") === process.env.BUILD_TOKEN;
  }
  return url.searchParams.has("__build");
}

function slugify(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/['':;,.!?()[\]{}&/\\#%*+=<>|@`~^_]/g, "").replace(/\s+/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function isKoreanDrama(s) {
  if (s.type !== "Scripted") return false;
  if (s.language === "Korean") return true;
  if (s.network?.country?.code === "KR") return true;
  if (s.webChannel?.country?.code === "KR") return true;
  return false;
}

function compact(s) {
  const year = s.premiered ? Number(s.premiered.slice(0, 4)) : null;
  const summary = (s.summary || "").replace(/<[^>]+>/g, "").trim();
  return {
    id: s.id, n: s.name, s: slugify(s.name), y: year,
    r: s.rating?.average ?? null, rt: s.averageRuntime ?? s.runtime ?? null,
    g: s.genres || [], st: s.status || null,
    nw: s.network?.name || s.webChannel?.name || null,
    p: s.image?.medium || null, po: s.image?.original || null,
    pr: s.premiered || null, ed: s.ended || null, w: s.weight || 0,
    su: summary.length > 220 ? summary.slice(0, 217) + "…" : summary,
    im: s.externals?.imdb || null, u: s.url, up: s.updated || 0,
  };
}

async function fetchJson(url, signal, retries = 3) {
  for (let a = 0; a < retries; a++) {
    try {
      // Respect global backoff.
      const waitMs = globalBackoffUntil - Date.now();
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      const res = await fetch(url, {
        signal,
        headers: { "Accept": "application/json", "User-Agent": "KDramaWorld/1.0 (catalog-builder)" },
      });
      if (res.status === 404) return null;
      if (res.status === 429) {
        const w = Number(res.headers.get("retry-after")) || 8;
        globalBackoffUntil = Date.now() + w * 1000;
        await new Promise((r) => setTimeout(r, w * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (e.name === "AbortError") throw e;
      // Treat network errors as backoff signal.
      globalBackoffUntil = Math.max(globalBackoffUntil, Date.now() + 1500);
      await new Promise((r) => setTimeout(r, 2 ** a * 1000));
    }
  }
  throw new Error(`fetch failed: ${url}`);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function readBody(req) {
  if (req.method !== "POST") return null;
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "x"}`);
  if (!authorized(url)) { res.statusCode = 404; res.end("not found"); return; }

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), PAGE_BUDGET_MS + 4000);

  try {
    const body = req.method === "POST" ? (await readBody(req) || {}) : {};
    const startPage = Math.max(0, Number(url.searchParams.get("page")) || body.nextPage || 0);
    const forceRefresh = url.searchParams.has("refresh");
    const incoming = Array.isArray(body.shows) ? body.shows : [];

    // Serve from cache if available and fresh.
    if (!forceRefresh && _cached && Date.now() - _cachedAt < CACHE_TTL_MS) {
      const cachedList = _cached;
      const yearParam = url.searchParams.get("year");
      if (yearParam) {
        const y = Number(yearParam);
        const slice = cachedList.filter((s) => s.y === y);
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.setHeader("cache-control", "no-store");
        res.end(JSON.stringify({ done: true, year: y, count: cachedList.length, sliceCount: slice.length, shows: slice, fromCache: true }));
        return;
      }
      res.setHeader("content-type", "application/json; charset=utf-8");
      res.setHeader("cache-control", "no-store");
      res.end(JSON.stringify({ done: true, count: cachedList.length, shows: cachedList, fromCache: true, fetchedAt: new Date(_cachedAt).toISOString() }));
      return;
    }

    const shows = new Map();
    for (const s of incoming) if (s && s.id != null) shows.set(s.id, s);

    let page = startPage;
    let stoppedAt404 = false;
    const startedAt = Date.now();

    // Worker pool: CONCURRENCY workers each claiming pages in turn.
    let nextPageToFetch = startPage;
    let hit404 = false;
    async function worker() {
      while (!hit404 && !controller.signal.aborted && Date.now() - startedAt < PAGE_BUDGET_MS - 1500) {
        const p = nextPageToFetch++;
        const data = await fetchJson(`${BASE}?page=${p}`, controller.signal);
        if (data === null) { hit404 = true; break; }
        if (Array.isArray(data)) {
          for (const s of data) {
            if (!isKoreanDrama(s)) continue;
            const c = compact(s);
            if (c.y && c.y < MIN_YEAR) continue;
            if (!c.p && c.r == null && !c.su) continue;
            shows.set(c.id, c);
          }
        }
        await sleep(PAGE_INTER_PAGE_DELAY_MS);
      }
    }
    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.allSettled(workers);
    stoppedAt404 = hit404;
    page = nextPageToFetch;

    clearTimeout(deadline);
    const list = [...shows.values()];
    const bySlug = new Map();
    for (const s of list) {
      const existing = bySlug.get(s.s);
      if (!existing || (s.r ?? 0) > (existing.r ?? 0)) bySlug.set(s.s, s);
    }
    const finalShows = [...bySlug.values()].sort((a, b) => {
      if ((b.y || 0) !== (a.y || 0)) return (b.y || 0) - (a.y || 0);
      if ((b.w || 0) !== (a.w || 0)) return (b.w || 0) - (a.w || 0);
      return (b.r || 0) - (a.r || 0);
    });

    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    if (stoppedAt404) {
      _cached = finalShows;
      _cachedAt = Date.now();
      // Optional year filter so tooling can download incrementally without
      // hitting response-size limits (handy when the agent can't read huge
      // bodies in one go). ?year=2024 returns just that year's slice.
      const yearParam = url.searchParams.get("year");
      if (yearParam) {
        const y = Number(yearParam);
        const slice = finalShows.filter((s) => s.y === y);
        res.end(JSON.stringify({ done: true, year: y, count: finalShows.length, sliceCount: slice.length, shows: slice }));
        return;
      }
      res.end(JSON.stringify({
        done: true, lastPage: page - 1,
        count: finalShows.length, fetchedAt: new Date().toISOString(),
        shows: finalShows,
      }));
      return;
    }
    res.end(JSON.stringify({
      done: false, nextPage: page, count: finalShows.length,
      shows: finalShows,
    }));
  } catch (err) {
