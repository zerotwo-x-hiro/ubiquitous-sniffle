// Vercel Edge Middleware — prerender OG/Twitter meta for crawlers and link
// unfurlers (Twitter, Discord, iMessage, Slack, Facebook, LinkedIn, WhatsApp,
// etc.). Browsers also benefit because the first-paint <title> is right.
//
// Supported route families:
//   - /drama/:slug        — per-show (PINNED id map → /api/tvmaze, or singlesearch)
//   - /genres/:slug       — genre pages (static descriptor map)
//   - /actors/:slug       — actor pages (static descriptor map)
//   - /midnight-watchlist, /second-lead-syndrome, /emotional-damage — mood pages
//   - /, /explore, /genres, /actors, /lists, /about, /sources, /privacy, /terms
//
// Reads the built dist/index.html from the deployment origin and rewrites
// <title>, description, og:* and twitter:* tags before returning the HTML.
// JS hydration on the client is untouched — React takes over normally.
//
// Edge Runtime. Cached 60s edge + 5min SWR + 1day stale-if-error so bot
// traffic does not hammer origin.

// -----------------------------------------------------------------------------
// Route metadata maps (kept in sync with src/data.ts and src/pages/*).
// Edit these when adding/renaming curated genres, actors, moods or static pages.
// -----------------------------------------------------------------------------

// Pinned drama slugs → TVMaze id. Used as a fast-path before falling back to
// /singlesearch. Extend when adding a new curated drama with a known tvmazeId.
const PINNED = {
  "my-mister": 33840,
  goblin: 16150,
  "twinkling-watermelon": 71088,
  "sky-castle": 39318,
  signal: 9440,
  "strangers-from-hell": 40651,
  "my-love-from-the-star": 3704,
  "whats-wrong-with-secretary-kim": 36183,
};

const GENRES = {
  romance:           { name: "Romance",          blurb: "slow-burn yearning, office dates, and kisses that fix your week." },
  comedy:            { name: "Comedy",           blurb: "laugh-out-loud romantic comedies, chaotic friend groups, and absurdity that lands." },
  mystery:           { name: "Mystery",          blurb: "cold cases, hidden identities and puzzle-box narratives that reward attention." },
  crime:             { name: "Crime",            blurb: "detectives, serial killers and tense procedurals that refuse to wrap up neatly." },
  "sci-fi-and-fantasy": { name: "Sci-Fi & Fantasy", blurb: "time-slips, body swaps, immortals, monsters and mythic kingdoms." },
  family:            { name: "Family",           blurb: "side-dishes, sibling fights and quiet stories about the people you're stuck with." },
  thriller:          { name: "Thriller",         blurb: "one-more-episode tension, psychopaths and plots that don't let you look away." },
  drama:             { name: "Drama",            blurb: "the dramatic core of K-cinema — life, loss and the weight of being seen." },
  historical:        { name: "Historical",       blurb: "Joseon court intrigue, Goryeo princes and colonial-era resistance." },
};

const ACTORS = {
  "lee-ji-eun":    { name: "Lee Ji-eun (IU)",   blurb: "filmography — from My Mister to Moon Lovers." },
  "lee-dong-wook": { name: "Lee Dong-wook",     blurb: "filmography — from Goblin to Tunnel." },
  "gong-hyo-jin":  { name: "Gong Hyo-jin",      blurb: "filmography — queen of the rom-com." },
  "kim-go-eun":    { name: "Kim Go-eun",        blurb: "filmography — Goblin, Mr. Sunshine and beyond." },
  "hyun-bin":      { name: "Hyun Bin",          blurb: "filmography — Crash Landing on You, Secret Garden, Mr. Sunshine." },
  "son-ye-jin":    { name: "Son Ye-jin",        blurb: "filmography — Crash Landing on You, Mr. Sunshine." },
  "park-seo-joon": { name: "Park Seo-joon",     blurb: "filmography — Fight for My Way and more." },
  "kim-soo-hyun":  { name: "Kim Soo-hyun",      blurb: "filmography — Moon Lovers, Crash Landing, My Love from the Star." },
};

const MOODS = {
  "midnight-watchlist":   { title: "Midnight Watchlist",     blurb: "Tell us your mood. We'll hand you one obsession — with a reason, not a vibe." },
  "second-lead-syndrome": { title: "Second Lead Syndrome",   blurb: "The characters who deserved their own happy ending and didn't get one. We're still not over it." },
  "emotional-damage":     { title: "Emotional Damage Meter", blurb: "Some dramas end. The damage doesn't. Log exactly how destroyed you were — no flexing." },
};

// Static / single-page routes. Anything not matched elsewhere falls through to
// Vercel's default static HTML (which carries site-wide default OG tags).
const STATIC_PAGES = {
  "/":          { title: "KDramaWorld — Your World of Korean Dramas",              desc: "A cinematic Korean drama discovery experience — curated catalogues, ratings, posters and editorial picks, sourced live from TVMaze.", card: "summary_large_image" },
  "/explore":   { title: "Explore Korean Dramas",                                  desc: "Browse the full KDramaWorld archive — filter by genre, sort by rating or year, search titles and networks." },
  "/discover":  { title: "Explore Korean Dramas",                                  desc: "Browse the full KDramaWorld archive — filter by genre, sort by rating or year, search titles and networks." },
  "/genres":    { title: "Genres & Moods",                                         desc: "Browse K-dramas by genre — romance, thriller, fantasy, slice-of-life and more — with live counts from the archive." },
  "/actors":    { title: "Korean Actors",                                          desc: "Korean actors in the KDramaWorld universe — filmographies link back to dramas in the archive." },
  "/lists":     { title: "Hand-Built Collections",                                 desc: "Opinionated K-drama lists — all-time greats, hidden gems, perfect romantic comedies. Every pick is human-chosen." },
  "/about":     { title: "About KDramaWorld",                                      desc: "KDramaWorld is a small, opinionated, ad-free archive of Korean dramas — hand-verified, no fabricated data, no tracking." },
  "/sources":   { title: "Data Sources",                                           desc: "Where KDramaWorld gets its data — TVMaze primary, TMDB/OMDb server-side only, MyDramaList link-only. Ratings are always labelled by source." },
  "/privacy":   { title: "Privacy",                                                desc: "KDramaWorld privacy policy — no tracking, no accounts, no ads." },
  "/terms":     { title: "Terms",                                                  desc: "KDramaWorld terms of service." },
};

// -----------------------------------------------------------------------------
// Matching + fetching helpers
// -----------------------------------------------------------------------------

const DRAMA_RE = /^\/drama\/([^/?#]+)/;
const GENRE_RE = /^\/genres\/([^/?#]+)/;
const ACTOR_RE = /^\/actors\/([^/?#]+)/;
const MOOD_RE = /^\/(midnight-watchlist|second-lead-syndrome|emotional-damage)(?:\/|$)/;

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

// -----------------------------------------------------------------------------
// HTML rewriting
// -----------------------------------------------------------------------------

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
  var image = meta.image || null;
  var url = meta.url;
  var card = meta.card || (image ? "summary_large_image" : "summary");
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
      : "" // drop tag if no image (keeps summary card clean)
  );
  out = setMeta(
    out,
    /<meta[^>]+name="twitter:card"[^>]*>/i,
    '<meta name="twitter:card" content="' + card + '" />'
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
      : ""
  );
  return out;
}

// -----------------------------------------------------------------------------
// Resolve (title, description, image, card) for a given pathname.
// Returns null if no prerendering is needed (Vercel handles it normally).
// -----------------------------------------------------------------------------

async function resolveMeta(url, base) {
  var path = url.pathname;

  // Static single pages (exact match)
  var sp = STATIC_PAGES[path];
  if (sp) {
    return {
      title: sp.title,
      description: sp.desc,
      image: null,
      url: url.origin + path,
      card: sp.card || "summary",
    };
  }

  // Mood pages (/midnight-watchlist etc.)
  var moodMatch = path.match(MOOD_RE);
  if (moodMatch) {
    var m = MOODS[moodMatch[1]];
    if (m) {
      return {
        title: m.title,
        description: m.blurb,
        image: null,
        url: url.origin + path,
        card: "summary",
      };
    }
  }

  // Genre pages (/genres/:slug)
  var gMatch = path.match(GENRE_RE);
  if (gMatch) {
    var g = GENRES[gMatch[1].toLowerCase()];
    if (g) {
      return {
        title: g.name + " K-Dramas",
        description: "The best K-dramas in the " + g.name + " genre — " + g.blurb + " Curated, rated, poster-rich, live from TVMaze.",
        image: null,
        url: url.origin + path,
        card: "summary",
      };
    }
    return null; // unknown genre → let SPA render 404 redirect naturally
  }

  // Actor pages (/actors/:slug)
  var aMatch = path.match(ACTOR_RE);
  if (aMatch) {
    var a = ACTORS[aMatch[1].toLowerCase()];
    if (a) {
      return {
        title: a.name + " — Filmography",
        description: a.name + " " + a.blurb + " Dramas, ratings and posters on KDramaWorld.",
        image: null,
        url: url.origin + path,
        card: "summary",
      };
    }
    return null;
  }

  // Drama pages (/drama/:slug) — dynamic, hits TVMaze
  var dMatch = path.match(DRAMA_RE);
  if (dMatch) {
    var show = await fetchTvmazeShow(base, dMatch[1]);
    if (!show) return null;
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
      (summary.slice(0, 180) + (summary.length > 180 ? "…" : "")) + networkSuffix + rating + "." ||
      show.name + " on KDramaWorld — ratings, posters and details.";
    var image = (show.image && (show.image.original || show.image.medium)) || null;
    return {
      title: fullTitle,
      description: description,
      image: image,
      url: url.origin + path,
      card: "summary_large_image",
    };
  }

  return null;
}

// -----------------------------------------------------------------------------
// Middleware entry
// -----------------------------------------------------------------------------

export default async function middleware(req) {
  var url = new URL(req.url);
  var base = origin(req);

  var meta = await resolveMeta(url, base);
  if (!meta) return; // fall through to default routing / static HTML

  // Fetch the built shell from the deployment origin. Using a cache-busting
  // header on internal fetches keeps us from recursively hitting this
  // middleware and also ensures we always rewrite against a fresh shell.
  var htmlRes = await fetch(new URL("/index.html", base).toString(), {
    headers: {
      Accept: "text/html",
      "x-og-middleware": "bypass",
    },
  });
  if (!htmlRes.ok) return;
  var originalHtml = await htmlRes.text();

  // If the shell is already a middleware rewrite (edge case / redirect loop),
  // don't re-rewrite it.
  if (originalHtml.indexOf("x-og-middleware") !== -1) return;

  var newHtml = rewriteMeta(originalHtml, meta);

  return new Response(newHtml, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control":
        "public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400",
      "x-og-middleware": "kdramaworld",
    },
  });
}
