// api/admin/build-catalog.js
//
// ONE-SHOT ADMIN HELPER (build-time, not user-facing).
// Walks TVMaze /shows?page=N from 0 upward until 404, keeps only Korean
// scripted dramas (language=Korean or network/webChannel KR country),
// compacts each record to a minimal shape, and returns the whole thing as
// JSON. Intended to be invoked ONCE by the maintainer (this agent) after
// deploy, then saved into src/generated/tvmaze-catalog.json for bundling
// as a lazy-loaded JSON chunk. Guarded by a build token env var so random
// visitors can't hammer TVMaze through it.
//
// Runtime budget: ~300 pages * ~700ms (serial w/ small delay) = 3-4 min.
// maxDuration is 60s on hobby, so we checkpoint with ?page=N&cursor=ID and
// let the caller resume; each 60s window handles ~75 pages. Caller loops.

const BASE = "https://api.tvmaze.com/shows";
const PER_PAGE = 250;
const MIN_YEAR = 1990;
const TOKEN = process.env.BUILD_TOKEN || process.env.VERCEL_URL ? null : null;

// Allow invocation either via BUILD_TOKEN env match OR with no auth on
// preview URLs so we can use it immediately after deploy. Hobby deploys
// have no secrets by default, so we also accept ?__build=1 from
// *.vercel.app but only when invoked server-side (we don't link to this
// from anywhere in the UI, and robots.txt doesn't list it).
function authorized(url) {
  if (process.env.BUILD_TOKEN) {
    const t = new URL(url, "http://x").searchParams.get("token");
    return t === process.env.BUILD_TOKEN;
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
    id: s.id,
    n: s.name,
    s: slugify(s.name),
    y: year,
    r: s.rating?.average ?? null,
    rt: s.averageRuntime ?? s.runtime ?? null,
    g: s.genres || [],
    st: s.status || null,
    nw: s.network?.name || s.webChannel?.name || null,
    p: s.image?.medium || null,
    po: s.image?.original || null,
    pr: s.premiered || null,
    ed: s.ended || null,
    w: s.weight || 0,
    su: summary.length > 240 ? summary.slice(0, 237) + "…" : summary,
    im: s.externals?.imdb || null,
    u: s.url,
    up: s.updated || 0,
  };
}

async function fetchPage(page, signal) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${BASE}?page=${page}`, {
        signal,
        headers: { "Accept": "application/json", "User-Agent": "KDramaWorld/1.0 (catalog-builder)" },
      });
      if (res.status === 404) return null;
      if (res.status === 429) {
        const wait = Number(res.headers.get("retry-after")) || 5;
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (e.name === "AbortError") throw e;
      await new Promise((r) => setTimeout(r, 2 ** attempt * 800));
    }
  }
  throw new Error(`page ${page} failed after 4 retries`);
}

// Read body if POST (carry may be large).
async function readBody(req) {
  if (req.method !== "POST") return null;
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "x"}`);
  if (!authorized(url)) { res.statusCode = 404; res.end("not found"); return; }

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 50_000);

  try {
    const startPage = Math.max(0, Number(url.searchParams.get("page")) || 0);
    const body = req.method === "POST" ? await readBody(req) : null;
    const incoming = (body && Array.isArray(body.shows)) ? body.shows : [];

    const shows = new Map();
    for (const s of incoming) if (s && s.id != null) shows.set(s.id, s);

    let page = startPage;
    let hitDeadline = false;
    let stoppedAt404 = false;
    const startedAt = Date.now();
    for (; page < 500; page++) {
      if (Date.now() - startedAt > 45_000) { hitDeadline = true; break; }
      const data = await fetchPage(page, controller.signal);
      if (data === null) { stoppedAt404 = true; break; }
      for (const s of data) {
        if (!isKoreanDrama(s)) continue;
        const c = compact(s);
        if (c.y && c.y < MIN_YEAR) continue;
        if (!c.p && c.r == null && !c.su) continue;
        shows.set(c.id, c);
      }
      await new Promise((r) => setTimeout(r, 180));
    }

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
      res.end(JSON.stringify({
        done: true,
        lastPage: page - 1,
        count: finalShows.length,
        fetchedAt: new Date().toISOString(),
        shows: finalShows,
      }));
      return;
    }
    res.end(JSON.stringify({ done: false, nextPage: page, count: finalShows.length, shows: finalShows, hitDeadline }));
  } catch (err) {
    clearTimeout(deadline);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: String(err && err.message || err) }));
  }
}
