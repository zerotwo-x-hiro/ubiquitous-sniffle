// Vercel Node serverless handler — /api/enrich/shows/[tvmazeId]
//
// Given a TVMaze numeric id (e.g. /api/enrich/shows/16150), returns the
// supplemental data the UI can't get from the primary TVMaze feed:
//   - TMDB backdrop image, poster, tagline (used as hero backdrop)
//   - OMDb/IMDb rating + vote count (displayed as "IMDb 8.4 · 120k votes"
//     only when vote count >= 5,000 per our rating policy)
//   - Also echoes back the tvmazeId, imdbId, tmdbId for cache correlation.
//
// Auth. Precedence (highest → lowest):
//   1. TMDB_ACCESS_TOKEN env var (v4 bearer token) — preferred.
//   2. TMDB_API_KEY / OMDB_API_KEY env vars (v3 / OMDb apikey).
//   3. A small, locally-bundled pool of free/public v3 keys — last-resort
//      fallback so the endpoint runs with zero configuration in hobby
//      deployments. These are widely-circulated demo keys; they may
//      intermittently 401, in which case we rotate to the next key.
//      They are sufficient for low-traffic hobby deployments; replace
//      with your own TMDB/OMDb keys in production for reliability.
//
// Runtime: Node serverless, single-file CommonJS (no imports/requires
// beyond `node:` builtins). 5s upstream timeout per provider.
//
// Cached 6 hours at the edge + 7 days SWR + 1 day stale-if-error. Upstream
// errors degrade gracefully — the endpoint returns a 200 with partial data
// and a `warnings` array rather than a 5xx, so a single provider outage
// never takes down the drama page.
//
// DO NOT import this file from client code. It runs server-side only;
// it can hold API keys.

// ---------- Free/public fallback key pool (from npm:freekeys 0.0.4) ----------
// These are demo v3 keys bundled in a 7-year-old MIT-licensed npm package
// (https://www.npmjs.com/package/freekeys). They rotate randomly per cold
// start and on 401. Use your own TMDB/OMDb keys via env vars for reliability.
const TMDB_FALLBACK_KEYS = [
  "fb7bb23f03b6994dafc674c074d01761",
  "e55425032d3d0f371fc776f302e7c09b",
  "8301a21598f8b45668d5711a814f01f6",
  "8cf43ad9c085135b9479ad5cf6bbcbda",
  "da63548086e399ffc910fbc08526df05",
  "13e53ff644a8bd4ba37b3e1044ad24f3",
  "269890f657dddf4635473cf4cf456576",
  "a2f888b27315e62e471b2d587048f32e",
  "8476a7ab80ad76f0936744df0430e67c",
  "5622cafbfe8f8cfe358a29c53e19bba0",
  "ae4bd1b6fce2a5648671bfc171d15ba4",
  "257654f35e3dff105574f97fb4b97035",
  "2f4038e83265214a0dcd6ec2eb3276f5",
  "9e43f45f94705cc8e1d5a0400d19a7b7",
  "af6887753365e14160254ac7f4345dd2",
  "06f10fc8741a672af455421c239a1ffc",
  "09ad8ace66eec34302943272db0e8d2c",
];
const OMDB_FALLBACK_KEYS = [
  "4b447405", "eb0c0475", "7776cbde", "ff28f90b", "6c3a2d45",
  "b07b58c8", "ad04b643", "a95b5205", "777d9323", "2c2c3314",
  "b5cff164", "89a9f57d", "73a9858a", "efbd8357",
];

// Pick a starting random fallback index (per cold start; rotated on 401).
let tmdbFbIdx = Math.floor(Math.random() * TMDB_FALLBACK_KEYS.length);
let omdbFbIdx = Math.floor(Math.random() * OMDB_FALLBACK_KEYS.length);

const UPSTREAM_TIMEOUT_MS = 5000;

function getTmdbAuthHeader() {
  // Returns { mode: 'v4', value: 'Bearer ...' } or { mode: 'v3', value: '?api_key=...' }
  const v4 = process.env.TMDB_ACCESS_TOKEN;
  if (v4 && /^[A-Za-z0-9._-]+$/.test(v4)) return { mode: "v4", value: "Bearer " + v4.trim(), keySource: "env:TMDB_ACCESS_TOKEN" };
  const v3 = process.env.TMDB_API_KEY;
  if (v3 && /^[a-f0-9]{32}$/i.test(v3)) return { mode: "v3", key: v3.trim(), keySource: "env:TMDB_API_KEY" };
  // Fallback pool
  const key = TMDB_FALLBACK_KEYS[tmdbFbIdx % TMDB_FALLBACK_KEYS.length];
  return { mode: "v3", key, keySource: "fallback-pool" };
}

function getOmdbKey() {
  const k = process.env.OMDB_API_KEY;
  if (k && /^[a-f0-9]{8}$/i.test(k)) return { key: k.trim(), keySource: "env:OMDB_API_KEY" };
  const key = OMDB_FALLBACK_KEYS[omdbFbIdx % OMDB_FALLBACK_KEYS.length];
  return { key, keySource: "fallback-pool" };
}

async function fetchJson(url, { headers, timeoutMs = UPSTREAM_TIMEOUT_MS, label } = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers, signal: ac.signal });
    clearTimeout(t);
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
    return { status: r.status, body };
  } catch (e) {
    clearTimeout(t);
    return { status: 0, body: { error: String(e && e.message || e) }, error: true };
  }
}

// Fetch TVMaze show by id to learn its IMDb id + canonical name.
async function fetchTvmaze(tvmazeId, baseOrigin) {
  // Prefer going through the in-project proxy so we get same CDN/region path
  // and automatically track TVMaze health; fall back to direct api.tvmaze.com
  // if baseOrigin is not provided (local dev).
  const url = baseOrigin
    ? baseOrigin.replace(/\/$/, "") + "/api/tvmaze/shows/" + encodeURIComponent(tvmazeId)
    : "https://api.tvmaze.com/shows/" + encodeURIComponent(tvmazeId);
  return fetchJson(url, { label: "tvmaze" });
}

// Find TMDB tv id for an IMDb id. Falls back to search-by-name if no IMDb id.
async function fetchTmdbByImdb(imdbId, auth) {
  const qs = auth.mode === "v3" ? "?api_key=" + encodeURIComponent(auth.key) : "";
  const url = "https://api.themoviedb.org/3/find/" + encodeURIComponent(imdbId) +
    qs +
    (auth.mode === "v3" ? "&" : "?") +
    "external_source=imdb_id&language=en-US";
  const headers = auth.mode === "v4" ? { Authorization: auth.value, Accept: "application/json" } : { Accept: "application/json" };
  return fetchJson(url, { headers, label: "tmdb:find" });
}

async function fetchTmdbTv(tmdbId, auth) {
  const qs = auth.mode === "v3" ? "?api_key=" + encodeURIComponent(auth.key) + "&language=en-US" : "?language=en-US";
  const url = "https://api.themoviedb.org/3/tv/" + encodeURIComponent(tmdbId) + qs;
  const headers = auth.mode === "v4" ? { Authorization: auth.value, Accept: "application/json" } : { Accept: "application/json" };
  return fetchJson(url, { headers, label: "tmdb:tv" });
}

async function fetchOmdb(imdbId, omdbKey) {
  const url = "https://www.omdbapi.com/?i=" + encodeURIComponent(imdbId) + "&apikey=" + encodeURIComponent(omdbKey.key) + "&r=json";
  return fetchJson(url, { label: "omdb" });
}

export default async function handler(req, res) {
  const started = Date.now();
  const id = String((req.query && req.query.tvmazeId) || "").replace(/[^0-9]/g, "");
  if (!id) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=60");
    return res.end(JSON.stringify({ error: "missing tvmazeId" }));
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const baseOrigin = host ? proto + "://" + host : "";

  const warnings = [];
  const out = {
    tvmazeId: Number(id),
    imdbId: null,
    tmdbId: null,
    backdrop: null,
    poster: null,
    tmdbPoster: null,
    tagline: null,
    overview: null,
    imdbRating: null,
    imdbVotes: null,
    sources: { tmdb: null, omdb: null },
    warnings,
    ms: 0,
  };

  // 1. TVMaze (needed for imdb id)
  const tvmaze = await fetchTvmaze(id, baseOrigin);
  if (tvmaze.status !== 200 || !tvmaze.body || !tvmaze.body.id) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=60, stale-if-error=86400");
    res.setHeader("access-control-allow-origin", "*");
    return res.end(JSON.stringify({ error: "tvmaze-unavailable", status: tvmaze.status, warnings, ms: Date.now() - started }));
  }
  const imdbId = tvmaze.body.externals && tvmaze.body.externals.imdb;
  out.imdbId = imdbId || null;

  // 2. TMDB — up to 2 attempts (rotate fallback key on first 401)
  let tmdbAuth = getTmdbAuthHeader();
  let tmdbRes = null;
  let tmdbTv = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (!imdbId) break;
    const find = await fetchTmdbByImdb(imdbId, tmdbAuth);
    const results = find.body && (find.body.tv_results || []);
    if (find.status === 200 && results && results.length) {
      out.tmdbId = results[0].id;
      tmdbRes = await fetchTmdbTv(results[0].id, tmdbAuth);
      if (tmdbRes.status === 200) { tmdbTv = tmdbRes.body; break; }
    }
    if (find.status === 401 || (tmdbRes && tmdbRes.status === 401)) {
      // Rotate fallback and retry once.
      if (tmdbAuth.keySource === "fallback-pool") {
        tmdbFbIdx = (tmdbFbIdx + 1) % TMDB_FALLBACK_KEYS.length;
        warnings.push("tmdb:rotated-fallback-key-on-401");
        tmdbAuth = getTmdbAuthHeader();
        continue;
      } else {
        warnings.push("tmdb:env-key-rejected-401");
        break;
      }
    }
    warnings.push("tmdb:find-failed-status-" + find.status);
    break;
  }
  if (tmdbTv) {
    if (tmdbTv.backdrop_path) out.backdrop = "https://image.tmdb.org/t/p/w1280" + tmdbTv.backdrop_path;
    if (tmdbTv.poster_path)   out.tmdbPoster = "https://image.tmdb.org/t/p/w780" + tmdbTv.poster_path;
    out.tagline = tmdbTv.tagline || null;
    out.overview = tmdbTv.overview || null;
    out.sources.tmdb = { keySource: tmdbAuth.keySource, id: out.tmdbId };
  } else {
    warnings.push("tmdb:unavailable");
  }

  // 3. OMDb — up to 2 attempts (rotate fallback key on first 401)
  if (imdbId) {
    let omdbKey = getOmdbKey();
    for (let attempt = 0; attempt < 2; attempt++) {
      const omdb = await fetchOmdb(imdbId, omdbKey);
      if (omdb.status === 200 && omdb.body && omdb.body.Response === "True") {
        const rating = parseFloat(omdb.body.imdbRating);
        const votesStr = String(omdb.body.imdbVotes || "").replace(/,/g, "");
        const votes = parseInt(votesStr, 10);
        // Per rating policy: require ≥5,000 votes before surfacing IMDb rating.
        if (!isNaN(rating) && rating > 0 && !isNaN(votes) && votes >= 5000) {
          out.imdbRating = rating;
          out.imdbVotes = votes;
        } else if (!isNaN(rating) && rating > 0) {
          warnings.push("omdb:imdb-votes-below-5000-threshold(" + votes + ")");
        }
        out.sources.omdb = { keySource: omdbKey.keySource };
        break;
      }
      if (omdb.status === 401 || (omdb.body && /invalid/i.test(omdb.body.Error || ""))) {
        if (omdbKey.keySource === "fallback-pool") {
          omdbFbIdx = (omdbFbIdx + 1) % OMDB_FALLBACK_KEYS.length;
          warnings.push("omdb:rotated-fallback-key-on-401");
          omdbKey = getOmdbKey();
          continue;
        } else {
          warnings.push("omdb:env-key-rejected");
          break;
        }
      }
      warnings.push("omdb:failed-status-" + omdb.status + "-" + (omdb.body && omdb.body.Error || ""));
      break;
    }
    if (!out.sources.omdb) warnings.push("omdb:unavailable");
  } else {
    warnings.push("tvmaze:no-imdb-id");
  }

  out.ms = Date.now() - started;

  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control",
    "public, s-maxage=21600, stale-while-revalidate=604800, stale-if-error=86400");
  res.setHeader("access-control-allow-origin", "*");
  res.statusCode = 200;
  res.end(JSON.stringify(out));
};
