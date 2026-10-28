// Vercel Edge Middleware — prerender per-drama OG/Twitter meta for crawlers and
// link unfurlers (Twitter, Discord, iMessage, Slack, Facebook, etc.).
//
// Intercepts /drama/:slug, fetches TVMaze JSON for that show via the in-project
// /api/tvmaze proxy (cache-friendly), reads the built dist/index.html, and
// rewrites <title>, description, og:*, twitter:* tags before returning HTML.
//
// JS hydration on the client is untouched — React takes over normally. The
// rewrite exists so bots that don't run JS see correct per-drama OG cards.
// Browsers also benefit because the first-paint <title> is right.
//
// Runs on the Edge Runtime. Cached 60s edge + 5min SWR + 1day stale-if-error.

// Minimal slug → TVMaze id map for curated dramas. Falls back to singlesearch
// for any slug not here (covers live-schedule drama slugs).
const PINNED = {
  "my-mister": 33840,
  goblin: 16150,
  "twinkling-watermelon": 71088,
  "sky-castle": 39318,
  signal: 9440,
};

const DRAMA_RE = /^\/drama\/([^/?#]+)/;

function origin(req) {
  const h = req.headers.get("host") || req.headers.get("x-forwarded-host");
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (h && (h.includes("localhost") || h.startsWith("127.")) ? "http" : "https");
  if (h) return proto + "://" + h;
  return "https://kdramaworld-v2-1793173646.vercel.app";
}

async function fetchTvmazeShow(baseOrigin, slug) {
  if (PINNED[slug]) {
    try {
      const r = await fetch(baseOrigin + "/api/tvmaze/shows/" + PINNED[slug], {
        headers: { Accept: "application/json" },
      });
      if (r.ok) return await r.json();
    } catch (e) { /* fall through */ }
  }
  try {
    const q = slug.replace(/-/g, " ");
    const r = await fetch(
      baseOrigin + "/api/tvmaze/singlesearch/shows?q=" + encodeURIComponent(q),
      { headers: { Accept: "application/json" } }
    );
    if (r.ok) return await r.json();
  } catch (e) { /* fall through */ }
  return null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setMeta(html, selector, replacement) {
  if (selector.test(html)) return html.replace(selector, replacement);
  return html.replace(/<\/head>/i, replacement + "\n  </head>");
}

function rewriteMeta(html, meta) {
  var title = meta.title;
  var description = meta.description;
  var image = meta.image;
  var url = meta.url;
  var safeTitle = escapeHtml(title);
  var safeDesc = escapeHtml(description);
  var safeImg = image ? escapeHtml(image) : null;
  var safeUrl = escapeHtml(url);

  var out = html;
  out = out.replace(/<title>[^<]*<\/title>/i, "<title>" + safeTitle + "</title>");

  out = setMeta(
    out,
    /<meta[^>]+name="description"[^>]*>/i,
    '<meta name="description" content="' + safeDesc + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+property="og:title"[^>]*>/i,
    '<meta property="og:title" content="' + safeTitle + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+property="og:description"[^>]*>/i,
    '<meta property="og:description" content="' + safeDesc + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+property="og:url"[^>]*>/i,
    '<meta property="og:url" content="' + safeUrl + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+property="og:image"[^>]*>/i,
    safeImg
      ? '<meta property="og:image" content="' + safeImg + '" />'
      : '<meta property="og:image" content="" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+name="twitter:card"[^>]*>/i,
    '<meta name="twitter:card" content="' + (safeImg ? "summary_large_image" : "summary") + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+name="twitter:title"[^>]*>/i,
    '<meta name="twitter:title" content="' + safeTitle + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+name="twitter:description"[^>]*>/i,
    '<meta name="twitter:description" content="' + safeDesc + '" />'
  );
  out = setMeta(
    out,
    /<meta[^>]+name="twitter:image"[^>]*>/i,
    safeImg
      ? '<meta name="twitter:image" content="' + safeImg + '" />'
      : '<meta name="twitter:image" content="" />'
  );
  return out;
}

export default async function middleware(req) {
  var url = new URL(req.url);
  var match = url.pathname.match(DRAMA_RE);
  if (!match) return; // fall through to default routing
  var slug = match[1];

  var base = origin(req);
  var show = await fetchTvmazeShow(base, slug);
  if (!show) return;

  var htmlRes = await fetch(new URL("/index.html", base).toString(), {
    headers: { Accept: "text/html" },
  });
  if (!htmlRes.ok) return;
  var originalHtml = await htmlRes.text();

  var year = show.premiered ? show.premiered.slice(0, 4) : "";
  var fullTitle = year
    ? show.name + " (" + year + ") · KDramaWorld"
    : show.name + " · KDramaWorld";
  var summary = String(show.summary || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  var network = (show.network && show.network.name) || (show.webChannel && show.webChannel.name) || "";
  var rating = show.rating && show.rating.average ? " — rated " + show.rating.average + " on TVMaze" : "";
  var networkSuffix = network ? " on " + network : "";
  var description =
    summary.slice(0, 180) + (summary.length > 180 ? "…" : "") + networkSuffix + rating + "." ||
    show.name + " on KDramaWorld — ratings, posters and details.";
  var image = (show.image && (show.image.original || show.image.medium)) || null;

  var newHtml = rewriteMeta(originalHtml, {
    title: fullTitle,
    description: description,
    image: image,
    url: url.origin + url.pathname,
  });

  return new Response(newHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control":
        "public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400",
      "x-og-middleware": "kdramaworld",
    },
  });
}
