// Serve the same complete catalogue generated during the build.
import catalog from "../../src/generated/tvmaze-catalog.json" with { type: "json" };

function authorized(url) {
  if (process.env.BUILD_TOKEN) return url.searchParams.get("token") === process.env.BUILD_TOKEN;
  return url.searchParams.has("__build");
}
function compact(show) {
  return {
    id: show.id, n: show.name, s: show.slug, y: show.year, r: show.rating,
    rt: show.runtime, g: show.genres, st: show.status, nw: show.network,
    p: show.poster, po: show.posterOriginal, pr: show.premiered, ed: show.ended,
    w: show.weight, su: show.summary, im: show.imdb, u: show.url, up: show.updated,
  };
}
export default function handler(req, res) {
  const url = new URL(req.url || "/", "http://" + (req.headers.host || "x"));
  if (!authorized(url)) { res.statusCode = 404; res.end("not found"); return; }
  if (!catalog || !catalog._meta || catalog._meta.source !== "tvmaze" || !Array.isArray(catalog.shows) || catalog.shows.length < 2000 || catalog._meta.count !== catalog.shows.length) {
    res.statusCode = 503;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Complete TVMaze catalogue is not present in this deployment. Rebuild first." }));
    return;
  }
  const all = catalog.shows.map(compact);
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("access-control-allow-origin", "*");
  const yearParam = url.searchParams.get("year");
  if (yearParam) {
    const year = Number(yearParam), slice = all.filter((show) => show.y === year);
    res.end(JSON.stringify({ done: true, year, count: all.length, sliceCount: slice.length, shows: slice, fetchedAt: catalog._meta.fetchedAt }));
    return;
  }
  res.end(JSON.stringify({ done: true, count: all.length, shows: all, fetchedAt: catalog._meta.fetchedAt }));
}
