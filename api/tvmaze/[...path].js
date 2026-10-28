// Vercel Node serverless proxy for the TVMaze API.
//
// Client hits /api/tvmaze/<path>[?query], we forward to api.tvmaze.com.
// Path allow-list prevents abuse (only read endpoints we actually use).
//
// Deployed automatically by Vercel's zero-config Node function detection
// (api/**/*.js  →  Node.js 20.x serverless function).

const TVMAZE_BASE = "https://api.tvmaze.com";
const ALLOWED_PATHS = /^\/(shows|singlesearch\/shows|search\/shows|schedule\/web|schedule\/full)(\?|\/|$)/;
const UPSTREAM_TIMEOUT_MS = 10000;

function setCors(headers) {
  headers["access-control-allow-origin"] = "*";
  headers["access-control-allow-methods"] = "GET,OPTIONS";
  headers["access-control-allow-headers"] = "Accept,Content-Type";
  headers["access-control-max-age"] = "86400";
}

export default async function handler(req, res) {
  // CORS preflight.
  if (req.method === "OPTIONS") {
    setCors(res.getHeaders ? {} : res); // res.setHeader mutates directly
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "Accept,Content-Type",
      "access-control-max-age": "86400",
    });
    return res.end();
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "method not allowed" }));
  }

  // Vercel exposes { ...path } under req.query for catch-all routes —
  // if we're at api/tvmaze/[...path].js the wildcard comes in as
  // req.query.path = [shows, 16150] etc. Fall back to parsing req.url
  // if the shape is unexpected.
  let path;
  const qPath = req.query && req.query.path;
  if (Array.isArray(qPath) && qPath.length) {
    path = "/" + qPath.join("/");
  } else {
    const u = new URL(req.url, "http://x");
    path = u.pathname.replace(/^\/api\/tvmaze/, "") || "/";
  }
  // Query string from the incoming URL.
  const incomingUrl = new URL(req.url, "http://x");
  const qs = incomingUrl.search;
  const dest = TVMAZE_BASE + path + qs;

  if (!ALLOWED_PATHS.test(path)) {
    res.writeHead(403, { "content-type": "application/json" });
    return res.end(JSON.stringify({ error: "forbidden path", path }));
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(dest, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "KDramaWorld/1.0 (+https://kdramaworld-v2-1793173646.vercel.app/)",
      },
      signal: ac.signal,
    });

    clearTimeout(timer);

    const ct = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.arrayBuffer();
    const headers = {
      "content-type": ct,
      "cache-control": upstream.ok
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "no-store",
      "x-proxied-by": "kdramaworld-tvmaze",
    };
    setCors(headers);
    res.writeHead(upstream.status, headers);
    res.end(Buffer.from(body));
  } catch (err) {
    clearTimeout(timer);
    res.writeHead(502, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: "upstream error",
        detail: String((err && err.message) || err),
      })
    );
  }
}
