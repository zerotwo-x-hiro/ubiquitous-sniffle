// api/admin/build-catalog.js  (search-by-year strategy)
//
// Instead of paginating /shows?page=N (390+ requests, 60s budget tight),
// we hit /search/shows?q=(YYYY) for each year from MIN_YEAR to current
// year. TVMaze's search returns up to ~250 matches per query and Korean
// dramas are always titled with their premiere year in many data shapes,
// so this is ~35 fast requests — completes in ~5s on Vercel with no
// rate-limit risk. We union with a single /schedule/web/korean priming
// call and de-duplicate by id. The same Korean-filter applies.
//
// Still gated by ?__build=1 (or BUILD_TOKEN). Supports ?year=YYYY slice
// for incremental downloads after the cache is warm.

const MIN_YEAR = 1990;
const CACHE_TTL_MS = 1000 * 60 * 30;

let _cached = null;
let _cachedAt = 0;
let _warmingPromise = null;

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

async function fetchJson(url) {
  for (let a = 0; a < 3; a++) {
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": "KDramaWorld/1.0" } });
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 5000)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500 * (a + 1)));
    }
  }
  return null;
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

async function buildCatalog() {
  const shows = new Map();
  const currentYear = new Date().getFullYear();

  // 1) Core search-by-year sweep.
  const years = [];
  for (let y = MIN_YEAR; y <= currentYear + 1; y++) years.push(y);

  // Do a few parallel searches (TVMaze search is fast / cheap).
  const CHUNK = 4;
  for (let i = 0; i < years.length; i += CHUNK) {
    const batch = years.slice(i, i + CHUNK);
    const results = await Promise.all(batch.map((y) =>
      fetchJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent("(" + y + ")")}`)
    ));
    for (const arr of results) {
      if (!Array.isArray(arr)) continue;
      for (const { show } of arr) {
        if (!show || !isKoreanDrama(show)) continue;
        const c = compact(show);
        if (c.y && c.y < MIN_YEAR) continue;
        if (!c.p && c.r == null && !c.su) continue;
        shows.set(c.id, c);
      }
    }
  }

  // 2) Sprinkle in results from the schedule endpoint (airs in KR last/next
  // 4 weeks) to catch any currently-airing shows that search might miss.
  try {
    const schedule = await fetchJson("https://api.tvmaze.com/schedule?country=KR&days=14");
    if (Array.isArray(schedule)) {
      for (const ep of schedule) {
        const s = ep?._embedded?.show || ep.show;
        if (s && isKoreanDrama(s)) {
          const c = compact(s);
          if (!shows.has(c.id) && (c.p || c.r || c.su)) shows.set(c.id, c);
        }
      }
    }
  } catch {}

  return sortDedup([...shows.values()]);
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "x"}`);
  if (!authorized(url)) { res.statusCode = 404; res.end("not found"); return; }

  const forceRefresh = url.searchParams.has("refresh");
  if (!forceRefresh && _cached && Date.now() - _cachedAt < CACHE_TTL_MS) {
    return sendSliceOrAll(res, _cached, url, { fromCache: true, fetchedAt: new Date(_cachedAt).toISOString() });
  }
  if (!_warmingPromise) {
    _warmingPromise = buildCatalog().then((list) => {
      _cached = list;
      _cachedAt = Date.now();
      _warmingPromise = null;
      return list;
    }).catch((err) => {
      _warmingPromise = null;
      throw err;
    });
  }

  try {
    const all = await _warmingPromise;
    return sendSliceOrAll(res, all, url, { fetchedAt: new Date(_cachedAt).toISOString() });
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: String(err && err.message || err) }));
  }
}

function sendSliceOrAll(res, all, url, extra) {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  const yearParam = url.searchParams.get("year");
  if (yearParam) {
    const y = Number(yearParam);
    const slice = all.filter((s) => s.y === y);
    res.end(JSON.stringify({ done: true, year: y, count: all.length, sliceCount: slice.length, shows: slice, ...extra }));
    return;
  }
  res.end(JSON.stringify({ done: true, count: all.length, shows: all, ...extra }));
}
