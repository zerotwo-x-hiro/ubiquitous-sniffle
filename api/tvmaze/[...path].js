// Vercel serverless proxy for TVMaze API.
//
// Why a proxy?
// 1. Keeps TVMaze API traffic server-side so the origin and any future API
//    keys (TMDB/OMDb) aren't exposed to the browser.
// 2. Lets us set sane caching headers so repeat navigations don't re-hit
//    TVMaze every time.
// 3. Avoids CORS complications for any future enrichment sources.
//
// Usage from the client:
//   GET /api/tvmaze/shows/16150
//   GET /api/tvmaze/singlesearch/shows?q=Goblin
//   GET /api/tvmaze/search/shows?q=Signal
//   GET /api/tvmaze/schedule/web?date=2026-10-28&country=KR

export const config = {
  runtime: "edge",
  // 15s is generous enough for TVMaze; TVMaze is usually <1s.
  maxDuration: 15,
};

const TVMAZE_BASE = "https://api.tvmaze.com";
const ALLOWED_PATHS = /^\/(shows|singlesearch\/shows|search\/shows|schedule\/web|schedule\/full)(\?|\/|$)/;

function setCors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Accept,Content-Type");
  res.headers.set("Access-Control-Max-Age", "86400");
}

export default async function handler(req) {
  const url = new URL(req.url);
  const { pathname, search } = url;

  // Path is /api/tvmaze/...
  const path = pathname.replace(/^\/api\/tvmaze/, "") || "/";
  const dest = `${TVMAZE_BASE}${path}${search}`;

  // CORS preflight
  if (req.method === "OPTIONS") {
    const res = new Response(null, { status: 204 });
    setCors(res);
    return res;
  }

  if (req.method !== "GET") {
    const res = new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
    setCors(res);
    return res;
  }

  // Sanitize path: only allow known TVMaze read endpoints.
  if (!ALLOWED_PATHS.test(path)) {
    const res = new Response(JSON.stringify({ error: "forbidden path" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
    setCors(res);
    return res;
  }

  try {
    const upstream = await fetch(dest, {
      headers: {
        Accept: "application/json",
        // Identify so TVMaze can contact us if there's an issue (their API
        // docs ask for an identifying UA/Accept for high traffic).
        "User-Agent": "KDramaWorld/1.0 (+https://kdramaworld-v2-1793173646.vercel.app/)",
      },
      // Edge fetch honors AbortSignal.
      signal: AbortSignal.timeout(10000),
    });

    const body = upstream.body;
    const headers = new Headers(upstream.headers);

    // Strip cookies, set security-irrelevant CORS, add short cache.
    headers.delete("set-cookie");
    setCors({ headers });
    // Cache for 60s at edge, 5 min in browser stale-while-revalidate.
    headers.set(
      "cache-control",
      upstream.ok ? "public, s-maxage=60, stale-while-revalidate=300" : "no-store"
    );
    headers.set("x-proxied-by", "kdramaworld-tvmaze");
    // TVMaze returns application/json; we forward the content-type.
    return new Response(body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    const res = new Response(
      JSON.stringify({ error: "upstream error", detail: String(err && err.message || err) }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
    setCors(res);
    return res;
  }
}
