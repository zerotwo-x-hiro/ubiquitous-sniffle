// Vercel Edge Middleware — prerender per-drama OG/Twitter meta for crawlers and
// link unfurlers (Twitter, Discord, iMessage, Slack, Facebook, etc.).
//
// Intercepts requests to /drama/:slug, fetches the TVMaze JSON for that show
// via the in-project /api/tvmaze proxy (cache-friendly), reads the built
// dist/index.html from the static output, and rewrites <title>, description,
// og:*, twitter:* tags in the HTML before returning it.
//
// JS hydration on the client is untouched — React takes over normally. The
// edge rewrite only exists so bots that don't run JS see the right per-drama
// card. Browsers also benefit because the first-paint <title> is correct.
//
// Runs on the Edge Runtime; cached 60s at edge + 5min SWR + 1day stale-if-error.

// Minimal slug → TVMaze id map for curated dramas. Falls back to singlesearch
// for any slug not here (covers live-schedule drama slugs).
const PINNED: Record<string, number> = {
  "my-mister": 33840,
  goblin: 16150,
  "twinkling-watermelon": 71088,
  "sky-castle": 39318,
  signal: 9440,
};

const DRAMA_RE = /^\/drama\/([^/?#]+)/;

function origin(req: Request): string {
  const h = req.headers.get("host") || req.headers.get("x-forwarded-host");
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (h?.includes("localhost") || h?.startsWith("127.") ? "http" : "https");
  if (h) return `${proto}://${h}`;
  return "https://kdramaworld-v2-1793173646.vercel.app";
}

async function fetchTvmazeShow(baseOrigin: string, slug: string): Promise<any | null> {
  if (PINNED[slug]) {
    try {
      const r = await fetch(`${baseOrigin}/api/tvmaze/shows/${PINNED[slug]}`, {
        headers: { Accept: "application/json" },
      });
      if (r.ok) return await r.json();
    } catch {}
  }
  try {
    const q = slug.replace(/-/g, " ");
    const r = await fetch(
      `${baseOrigin}/api/tvmaze/singlesearch/shows?q=${encodeURIComponent(q)}`,
      { headers: { Accept: "application/json" } }
    );
    if (r.ok) return await r.json();
  } catch {}
  return null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setMeta(html: string, selector: RegExp, replacement: string): string {
  if (selector.test(html)) return html.replace(selector, replacement);
  // Inject before </head> if missing.
  return html.replace(/<\/head>/i, `${replacement}\n  </head>`);
}

function rewriteMeta(html: string, meta: {
  title: string;
  description: string;
  image?: string;
  url: string;
}): string {
  const { title, description, image, url } = meta;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImg = image ? escapeHtml(image) : null;
  const safeUrl = escapeHtml(url);

  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${safeTitle}</title>`);

  out = setMeta(out, /<meta[^>]+name="description"[^>]*>/i,
    `<meta name="description" content="${safeDesc}" />`);

  out = setMeta(out, /<meta[^>]+property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${safeTitle}" />`);
  out = setMeta(out, /<meta[^>]+property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${safeDesc}" />`);
  out = setMeta(out, /<meta[^>]+property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${safeUrl}" />`);
  out = setMeta(out, /<meta[^>]+property="og:image"[^>]*>/i,
    safeImg
      ? `<meta property="og:image" content="${safeImg}" />`
      : `<meta property="og:image" content="" />`);

  out = setMeta(out, /<meta[^>]+name="twitter:card"[^>]*>/i,
    `<meta name="twitter:card" content="${safeImg ? "summary_large_image" : "summary"}" />`);
  out = setMeta(out, /<meta[^>]+name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`);
  out = setMeta(out, /<meta[^>]+name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`);
  out = setMeta(out, /<meta[^>]+name="twitter:image"[^>]*>/i,
    safeImg
      ? `<meta name="twitter:image" content="${safeImg}" />`
      : `<meta name="twitter:image" content="" />`);

  return out;
}

export const config = {
  runtime: "edge",
  matcher: ["/drama/:path*"],
};

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  const match = url.pathname.match(DRAMA_RE);
  if (!match) return; // fall through to default routing
  const slug = match[1];

  const base = origin(req);
  const show = await fetchTvmazeShow(base, slug);
  if (!show) return;

  // Fetch the built index.html from our own static output.
  const htmlRes = await fetch(new URL("/index.html", base).toString(), {
    headers: { Accept: "text/html" },
  });
  if (!htmlRes.ok) return;
  let originalHtml = await htmlRes.text();

  const year = show.premiered ? show.premiered.slice(0, 4) : "";
  const fullTitle = year
    ? `${show.name} (${year}) · KDramaWorld`
    : `${show.name} · KDramaWorld`;
  const summary = String(show.summary || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const network = show.network?.name || show.webChannel?.name || "";
  const rating = show.rating?.average ? ` — rated ${show.rating.average} on TVMaze` : "";
  const networkSuffix = network ? ` on ${network}` : "";
  const description =
    `${summary.slice(0, 180)}${summary.length > 180 ? "…" : ""}${networkSuffix}${rating}.` ||
    `${show.name} on KDramaWorld — ratings, posters and details.`;
  const image = show.image?.original || show.image?.medium;

  const newHtml = rewriteMeta(originalHtml, {
    title: fullTitle,
    description,
    image,
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
