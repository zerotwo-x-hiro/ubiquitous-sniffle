// Vercel Node serverless handler — /api/enrich/shows/:tvmazeId
//
// Optional server-side enrichment. For a given TVMaze show id:
//   - Fetches the TVMaze payload via /api/tvmaze/shows/:id
//   - If TMDB_ACCESS_TOKEN (or TMDB_DB_V3_TOKEN) is set, fetches TMDB
//     backdrop/poster/tagline.
//   - If OMDB_API_KEY is set, fetches IMDb rating / votes / Metascore.
//
// Returns merged JSON with heavy edge caching. If neither key is
// configured, returns 204 No Content so the client doesn't retry.
//
// Keys stay server-side; nothing here is ever exposed to the browser.

const UPSTREAM_TIMEOUT_MS = 6000;

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function fetchTmdb(tvmazeShow) {
  const token = process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_DB_V3_TOKEN;
  if (!token) return null;
  const imdbId = tvmazeShow && tvmazeShow.externals && tvmazeShow.externals.imdb;
  const year = tvmazeShow && tvmazeShow.premiered ? tvmazeShow.premiered.slice(0, 4) : "";
  const title = (tvmazeShow && tvmazeShow.name) || "";
  let url;
  if (imdbId) {
    url = "https://api.themoviedb.org/3/find/" + imdbId + "?external_source=imdb_id&language=en-US";
  } else if (title) {
    url = "https://api.themoviedb.org/3/search/tv?query=" + encodeURIComponent(title) + (year ? "&first_air_date_year=" + year : "") + "&language=en-US";
  } else {
    return null;
  }
  try {
    const r = await withTimeout(fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + token,
        "User-Agent": "KDramaWorld/1.0 (+server-side enrichment)",
      },
    }), UPSTREAM_TIMEOUT_MS);
    if (!r.ok) return null;
    const body = await r.json();
    const hit = (body.tv_results && body.tv_results[0]) || (body.results && body.results[0]) || null;
    if (!hit) return null;
    return {
      id: hit.id,
      backdrop: hit.backdrop_path ? "https://image.tmdb.org/t/p/w1280" + hit.backdrop_path : null,
      poster: hit.poster_path ? "https://image.tmdb.org/t/p/w780" + hit.poster_path : null,
      tagline: hit.tagline || null,
      homepage: hit.homepage || null,
      popularity: hit.popularity || null,
    };
  } catch (e) {
    return null;
  }
}

async function fetchOmdb(tvmazeShow) {
  const key = process.env.OMDB_API_KEY;
  if (!key) return null;
  const imdbId = tvmazeShow && tvmazeShow.externals && tvmazeShow.externals.imdb;
  if (!imdbId) return null;
  try {
    const url = "https://www.omdbapi.com/?i=" + encodeURIComponent(imdbId) + "&apikey=" + encodeURIComponent(key);
    const r = await withTimeout(fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "KDramaWorld/1.0" },
    }), UPSTREAM_TIMEOUT_MS);
    if (!r.ok) return null;
    const body = await r.json();
    if (!body || body.Response === "False") return null;
    const votes = parseInt(String(body.imdbVotes || "0").replace(/,/g, ""), 10) || 0;
    const rating = parseFloat(body.imdbRating);
    const metascore = parseInt(body.Metascore, 10);
    return {
      imdbId,
      imdbRating: Number.isFinite(rating) ? rating : null,
      imdbVotes: votes || null,
      metascore: Number.isFinite(metascore) ? metascore : null,
      rated: body.Rated || null,
      awards: body.Awards || null,
    };
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  var id = parseInt((req.query && req.query.tvmazeId) || "", 10);
  if (!id || !Number.isFinite(id)) {
    res.statusCode = 400;
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ error: "bad id" }));
  }

  const hasTmdb = !!(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_DB_V3_TOKEN);
  const hasOmdb = !!process.env.OMDB_API_KEY;
  if (!hasTmdb && !hasOmdb) {
    res.statusCode = 204;
    res.setHeader("cache-control", "public, max-age=86400");
    return res.end();
  }

  var host = req.headers["x-forwarded-host"] || req.headers.host;
  var proto = req.headers["x-forwarded-proto"] || (host && host.indexOf("localhost") !== -1 ? "http" : "https");
  var base = proto + "://" + host;

  try {
    const tvRes = await fetch(base + "/api/tvmaze/shows/" + id, {
      headers: { Accept: "application/json" },
    });
    if (!tvRes.ok) {
      res.statusCode = tvRes.status === 404 ? 404 : 502;
      res.setHeader("cache-control", "no-store");
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify({ error: "tvmaze fetch failed", status: tvRes.status }));
    }
    const show = await tvRes.json();
    const [tmdb, imdb] = await Promise.all([fetchTmdb(show), fetchOmdb(show)]);

    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("access-control-allow-origin", "*");
    res.statusCode = 200;
    res.end(JSON.stringify({ tvmaze: show, tmdb: tmdb, imdb: imdb }));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "upstream error", detail: String((e && e.message) || e) }));
  }
};
