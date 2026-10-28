// Vercel Node serverless handler — /api/enrich/shows/:tvmazeId
//
// Optional enrichment endpoint. For a given TVMaze show id:
//   - Fetches the TVMaze payload via /api/tvmaze/shows/:id
//   - If TMDB_ACCESS_TOKEN is set, merges TMDB backdrop/poster/tagline
//   - If OMDB_API_KEY is set, merges IMDb rating + votes + Metascore
//
// Returns the merged JSON with cache headers. If neither env var is set,
// returns 204 (no content) so the client knows not to call us repeatedly.
// This endpoint is server-side only: keys stay on Vercel, never hit the
// browser.

import { enrichShow } from "../../_enrich.js";

export default async function handler(req, res) {
  const id = parseInt((req.query && req.query.tvmazeId) || "", 10);
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

  // Determine host for internal proxy call.
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (host && host.includes("localhost") ? "http" : "https");
  const base = proto + "://" + host;

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
    const merged = await enrichShow(show);

    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("cache-control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("access-control-allow-origin", "*");
    res.statusCode = 200;
    res.end(JSON.stringify(merged));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "upstream error", detail: String((e && e.message) || e) }));
  }
}
