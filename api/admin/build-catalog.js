// api/admin/build-catalog.js (single-shot TVMaze search by year)
//
// Uses TVMaze's `/search/shows?q=` endpoint against the Korean year keyword
// pattern (e.g. "(2024)") — each response returns the highest-weight shows
// matching that year globally. To reliably capture *all* Korean dramas
// without paginating /shows (which takes ~380 hits and hits rate limits),
// we sweep over TVMaze's /shows by YEAR using a broader keyword search
// combined with per-page 250-show windows pulled via the existing /shows
// pages but with a much smaller target: only Korean scripted, filtered
// client-side.
//
// Reality check: to reliably get all Korean dramas, we *must* paginate
// /shows. With 2 workers at 180ms spacing we get ~10 pages/sec; 389 pages
// ≈ 40s. The previous 500s happened when workers clobbered TVMaze with
// 8-way concurrency + retries that spiraled into 429s. This version
// throttles harder, uses a conservative concurrency of 2, and includes
// global backoff. The /warm endpoint pre-populates the in-memory cache
// and returns quickly if called repeatedly.
//
// Query params:
//   ?__build=1                 — required (auth gate)
//   ?refresh=1                 — bust in-memory cache
//   ?year=YYYY                 — return only that year's slice (after cache warm)

const BASE = "https://api.tvmaze.com/shows";
const MIN_YEAR = 1990;
const PAGE_BUDGET_MS = 50_000;
const CONCURRENCY = 2;
const INTER_REQ_DELAY_MS = 220;
const MAX_PAGES = 700;

let _cached = null;
let _cachedAt = 0;
let _warmingPromise = null;
const CACHE_TTL_MS = 1000 * 60 * 30;

function authorized(url) {
  if (process.env.BUILD_TOKEN) return url.searchParams.get("token") === process.env.BUILD_TOKEN;
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

let globalBackoffUntil = 0;
async function fetchJson(url, signal) {
  for (let a = 0; a < 3; a++) {
    try {
      const waitMs = globalBackoffUntil - Date.now();
      if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
      const res = await fetch(url, {
        signal,
        headers: { "Accept": "application/json", "User-Agent": "KDramaWorld/1.0" },
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
      globalBackoffUntil = Math.max(globalBackoffUntil, Date.now() + 2000);
      await new Promise((r) => setTimeout(r, 2 ** a * 1000));
    }
  }
  return null; // skip page rather than failing the whole build
}

function sortDedup(list) {
  const bySlug = new Map();
  for (const s of list) {
    const existing = bySlug.get(s.s);
    if (!existing || (s.r ?? -1) > (existing.r ?? -1) || (s.w ?? 0) > (existing.w ?? 0)) bySlug.set(s.s, s);
  }
  return [...bySlug.values()].sort((a, b) => {
    if ((b.y || 0) !== (a.y || 0)) return (b.y || 0) - (a.y || 0);
    if ((b.w || 0) !== (a.w || 0)) return (b.w || 0) - (a.w || 0);
    return (b.r || 0) - (a.r || 0);
  });
}

async function buildCatalog(signal, startPage = 0) {
  const shows = new Map();
  let nextPageToFetch = startPage;
  let hit404 = false;
  const startedAt = Date.now();

  async function worker() {
    while (!hit404 && !signal.aborted && Date.now() - startedAt < PAGE_BUDGET_MS - 2000) {
      const p = nextPageToFetch++;
      const data = await fetchJson(`${BASE}?page=${p}`, signal);
      if (data === null) {
        // Treat null (404) as terminal. A soft fetch failure returns [] after
        // retries via fetchJson, which just means we skip that page.
        if (p > 50) { hit404 = true; break; }
        await new Promise((r) => setTimeout(r, INTER_REQ_DELAY_MS));
        continue;
      }
      if (Array.isArray(data)) {
        for (const s of data) {
          if (!isKoreanDrama(s)) continue;
          const c = compact(s);
          if (c.y && c.y < MIN_YEAR) continue;
          if (!c.p && c.r == null && !c.su) continue;
          shows.set(c.id, c);
        }
      }
      await new Promise((r) => setTimeout(r, INTER_REQ_DELAY_MS));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return { shows: [...shows.values()], stoppedAt404: hit404, nextPage: nextPageToFetch };
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "x"}`);
  if (!authorized(url)) { res.statusCode = 404; res.end("not found"); return; }

  const forceRefresh = url.searchParams.has("refresh");
  const warmOnly = url.searchParams.has("warm");

  // Serve cached immediately if fresh.
  if (!forceRefresh && _cached && Date.now() - _cachedAt < CACHE_TTL_MS) {
    return sendSliceOrAll(res, _cached, url, { fromCache: true, fetchedAt: new Date(_cachedAt).toISOString() });
  }

  // De-duplicate concurrent warm-up calls.
  if (!_warmingPromise) {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), PAGE_BUDGET_MS + 3000);
    _warmingPromise = (async () => {
      try {
        const { shows, stoppedAt404 } = await buildCatalog(controller.signal);
        if (stoppedAt404) {
          _cached = sortDedup(shows);
          _cachedAt = Date.now();
        }
        return { shows: _cached || sortDedup(shows), done: stoppedAt404 };
      } finally {
        clearTimeout(deadline);
        _warmingPromise = null;
      }
    })();
  }

  try {
    // If warm-only: return progress (don't wait for completion if it's
    // taking too long).
    if (warmOnly) {
      const result = await Promise.race([
        _warmingPromise,
        new Promise((r) => setTimeout(() => r({ warming: true, cached: !!_cached }), 2000)),
      ]);
      res.setHeader("content-type", "application/json");
      res.setHeader("cache-control", "no-store");
      if (result && result.shows) {
        res.end(JSON.stringify({ warming: false, done: result.done, count: result.shows.length }));
      } else {
        res.end(JSON.stringify(result));
      }
      return;
    }

    const { shows: all, done } = await _warmingPromise;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    if (done) return sendSliceOrAll(res, all, url, { fetchedAt: new Date(_cachedAt).toISOString() });
    res.end(JSON.stringify({ done: false, count: all.length, note: "catalog warm incomplete; retry after calling ?warm=1 a few times" }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: String(err && err.message || err) }));
  }
}

function sendSliceOrAll(res, all, url, extra) {
  const yearParam = url.searchParams.get("year");
  if (yearParam) {
    const y = Number(yearParam);
    const slice = all.filter((s) => s.y === y);
    res.end(JSON.stringify({ done: true, year: y, count: all.length, sliceCount: slice.length, shows: slice, ...extra }));
    return;
  }
  res.end(JSON.stringify({ done: true, count: all.length, shows: all, ...extra }));
}
