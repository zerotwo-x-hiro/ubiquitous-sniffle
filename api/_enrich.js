// Shared server-side enrichment helper.
//
// Given a TVMaze show object, fetches (in parallel, gated on env vars):
//   - TMDB match (TMDB_ACCESS_TOKEN Bearer token) -> backdrop + tagline + higher-res poster
//   - OMDb match (OMDB_API_KEY)                 -> IMDb rating + vote count + Metascore
//
// Returns a plain object { tmdb?, imdb? } with only the fields we actually
// use. If the required env var isn't set (or the fetch fails / times out),
// that source is simply omitted — the page must degrade gracefully.
//
// ONLY called from serverless functions. Never runs in the browser. Keys
// are never returned to the client unless they came from TVMaze.

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

  // Match by IMDb id first (if TVMaze gave us externals.imdb), else by title+year.
  const imdbId = tvmazeShow && tvmazeShow.externals && tvmazeShow.externals.imdb;
  const year = tvmazeShow && tvmazeShow.premiered ? tvmazeShow.premiered.slice(0, 4) : "";
  const title = (tvmazeShow && tvmazeShow.name) || "";

  let url;
  if (imdbId) {
    url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&language=en-US`;
  } else if (title) {
    url = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(title)}${year ? "&first_air_date_year=" + year : ""}&language=en-US`;
  } else {
    return null;
  }

  try {
    const r = await withTimeout(
      fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + token,
          "User-Agent": "KDramaWorld/1.0 (+server-side enrichment)",
        },
      }),
      UPSTREAM_TIMEOUT_MS
    );
    if (!r.ok) return null;
    const body = await r.json();
    const hit =
      (body.tv_results && body.tv_results[0]) ||
      (body.results && body.results[0]) ||
      null;
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
    const url = `https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${encodeURIComponent(key)}`;
    const r = await withTimeout(
      fetch(url, { headers: { Accept: "application/json", "User-Agent": "KDramaWorld/1.0" } }),
      UPSTREAM_TIMEOUT_MS
    );
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

export async function enrichShow(tvmazeShow) {
  if (!tvmazeShow) return { tvmaze: null, tmdb: null, imdb: null };
  const [tmdb, imdb] = await Promise.all([fetchTmdb(tvmazeShow), fetchOmdb(tvmazeShow)]);
  return { tvmaze: tvmazeShow, tmdb, imdb };
}
