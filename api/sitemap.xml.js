// Vercel Node serverless handler — /api/sitemap.xml
//
// Generates an XML sitemap listing:
//   - All static routes (home, explore, genres index + per-genre, actors index
//     + per-actor, moods, lists, about, sources, legal pages)
//   - Every curated drama by slug
//   - Live-schedule drama slugs pulled on demand from TVMaze (cached so search
//     engines don't trigger a TVMaze fetch on every sitemap request)
//
// Cached at edge for 1 hour with a 1 day SWR so crawlers never pay the TVMaze
// cost. Non-2xx upstream response falls back to static-only entries.

const STATIC_PATHS = [
  "/",
  "/explore",
  "/genres",
  "/actors",
  "/lists",
  "/about",
  "/sources",
  "/privacy",
  "/terms",
  "/midnight-watchlist",
  "/second-lead-syndrome",
  "/emotional-damage",
];

const GENRE_SLUGS = [
  "romance", "comedy", "mystery", "crime", "sci-fi-and-fantasy",
  "family", "thriller", "drama", "historical",
];

const ACTOR_SLUGS = [
  "lee-ji-eun", "lee-dong-wook", "gong-hyo-jin", "kim-go-eun",
  "hyun-bin", "son-ye-jin", "park-seo-joon", "kim-soo-hyun",
];

// Keep this curated list in sync with src/data.ts (it's the slug list used
// for /drama/:slug URLs; generating it at build-time would avoid the drift
// but pulling it at runtime via a direct import would balloon the lambda.
// For now we maintain parity by adding new slugs here when adding to data.ts).
const CURATED_DRAMA_SLUGS = [
  "my-mister", "when-life-gives-you-tangerines", "twinkling-watermelon",
  "reply-1988", "lovely-runner", "alchemy-of-souls", "hospital-playlist",
  "goblin", "marry-my-husband", "business-proposal", "extraordinary-attorney-woo",
  "the-glory", "twenty-five-twenty-one", "my-dearest", "moon-lovers",
  "weightlifting-fairy", "coffee-prince", "fight-for-my-way", "my-liberation-notes",
  "run-on", "youth-of-may", "daily-dose-of-sunshine", "crash-landing-on-you",
  "mr-sunshine", "mouse", "flower-of-evil", "signal", "healer", "kingdom",
  "sky-castle", "tunnel", "squid-game", "arthdal", "secret-garden", "chicago-typewriter",
  // Extra titles present on the homepage/shelves with a dedicated page but
  // shorter seed entries:
  "strangers-from-hell", "my-love-from-the-star", "whats-wrong-with-secretary-kim",
];

function baseOrigin(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (host && host.includes("localhost") ? "http" : "https");
  return proto + "://" + host;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, changefreq, priority) {
  return (
    "  <url>\n" +
    "    <loc>" + escapeXml(loc) + "</loc>\n" +
    "    <changefreq>" + changefreq + "</changefreq>\n" +
    "    <priority>" + priority + "</priority>\n" +
    "  </url>"
  );
}

async function fetchLiveSchedule(base) {
  // Pull Korean web-schedule dramas aired/premiering in a wide window so we
  // generate sitemap entries for /drama/:tvId slugs that the client creates
  // for live items. Slugs on the client are `${show.name}-${show.id}` kebab'd,
  // but that's deterministic; we mirror it here.
  try {
    const r = await fetch(base + "/api/tvmaze/schedule/web?country=KR", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return [];
    const arr = await r.json();
    const out = [];
    const seen = new Set();
    for (const ep of arr) {
      const show = ep && ep._embedded && ep._embedded.show;
      if (!show || !show.id) continue;
      if (show.language && show.language !== "Korean") continue;
      if (seen.has(show.id)) continue;
      seen.add(show.id);
      const slug = (show.name || "").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + show.id;
      if (slug) out.push(slug);
    }
    return out;
  } catch (e) {
    return [];
  }
}

export default async function handler(req, res) {
  const base = baseOrigin(req);

  const liveSlugs = await fetchLiveSchedule(base);

  const dramaSlugs = new Set(CURATED_DRAMA_SLUGS);
  for (const s of liveSlugs) dramaSlugs.add(s);

  const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];

  for (const p of STATIC_PATHS) {
    lines.push(urlEntry(base + p, p === "/" ? "hourly" : "weekly", p === "/" ? "1.0" : "0.7"));
  }
  for (const g of GENRE_SLUGS) {
    lines.push(urlEntry(base + "/genres/" + g, "weekly", "0.6"));
  }
  for (const a of ACTOR_SLUGS) {
    lines.push(urlEntry(base + "/actors/" + a, "monthly", "0.5"));
  }
  for (const s of dramaSlugs) {
    lines.push(urlEntry(base + "/drama/" + s, "weekly", "0.8"));
  }

  lines.push("</urlset>");

  const body = lines.join("\n");

  res.setHeader("content-type", "application/xml; charset=utf-8");
  res.setHeader("cache-control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.statusCode = 200;
  res.end(body);
}
