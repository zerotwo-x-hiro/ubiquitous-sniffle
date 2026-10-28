// Node smoke test — fetch-based, no browser required.
// Hits the production (or $SMOKE_BASE_URL) deployment, verifies status codes,
// titles, OG tags, health endpoint, sitemap, and that key pages return Korean
// theme markers (the dojang seal / hero Hangul) as a sanity check that the
// latest bundle is actually being served.
//
// Requires Node 18+ for the global fetch API.
// Run:
//   node scripts/smoke-fetch.mjs               (against production)
//   SMOKE_BASE_URL=http://localhost:4173 node scripts/smoke-fetch.mjs

const BASE = process.env.SMOKE_BASE_URL || "https://kdramaworld-v2-1793173646.vercel.app";
const fetchFn = fetch;

let passed = 0;
let failed = 0;
const failures = [];

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

async function check(name, url, { expectStatus = 200, titleIncludes, ogTitle, hasOgImage, contains, notContains, isJson, jsonOk } = {}) {
  let err = null;
  try {
    const res = await fetchFn(BASE + url, {
      headers: { "user-agent": "kdramaworld-smoke/1.0" },
      redirect: "follow",
    });
    const text = await res.text();
    const checks = [];
    if (res.status !== expectStatus) checks.push(`status=${res.status} (want ${expectStatus})`);
    if (titleIncludes) {
      const t = pick(text, /<title>([^<]+)<\/title>/i) || "";
      if (!t.includes(titleIncludes)) checks.push(`title "${t}" missing "${titleIncludes}"`);
    }
    if (ogTitle) {
      const t = pick(text, /<meta[^>]+property="og:title"[^>]*content="([^"]*)"/i) || "";
      if (!t.includes(ogTitle)) checks.push(`og:title "${t}" missing "${ogTitle}"`);
    }
    if (hasOgImage) {
      const img = pick(text, /<meta[^>]+property="og:image"[^>]*content="([^"]*)"/i);
      if (!img) checks.push("missing og:image");
      else if (hasOgImage === "tvmaze" && !/tvmaze\.com/.test(img)) checks.push(`og:image not TVMaze: ${img.slice(0,80)}`);
      else if (hasOgImage === "default" && !/og-default/.test(img)) checks.push(`og:image not default: ${img.slice(0,80)}`);
    }
    if (contains) for (const needle of contains) if (!text.includes(needle)) checks.push(`body missing "${needle.slice(0,40)}"`);
    if (notContains) for (const needle of notContains) if (text.includes(needle)) checks.push(`body should NOT contain "${needle.slice(0,40)}"`);
    if (isJson) {
      try {
        const j = JSON.parse(text);
        if (jsonOk && !jsonOk(j)) checks.push("JSON ok() predicate failed");
      } catch (e) { checks.push(`not valid JSON: ${e.message}`); }
    }
    if (checks.length) {
      err = checks.join("; ");
    }
  } catch (e) { err = String(e && e.message || e); }
  if (err) { failed++; failures.push(`  ✗ ${name} — ${err}`); console.log(`  ✗ ${name}`); }
  else     { passed++; console.log(`  ✓ ${name}`); }
}

console.log(`Smoke against ${BASE}\n`);

// --- Endpoints ---
await check("health 200 + ok:true + tvmaze ok", "/api/health", {
  isJson: true,
  jsonOk: j => j.ok === true && j.dependencies && j.dependencies.tvmaze && j.dependencies.tvmaze.ok === true,
});
await check("sitemap serves XML", "/api/sitemap.xml", { expectStatus: 200, contains: ["<?xml", "<urlset", "/drama/my-mister"] });
await check("robots.txt", "/robots.txt", { expectStatus: 200, contains: ["User-agent", "Sitemap:", "Disallow: /api/"] });

// --- Pages: titles ---
await check("home title", "/", { titleIncludes: "KDramaWorld", ogTitle: "KDramaWorld", hasOgImage: "default", contains: ["오늘의 드라마", "韓"] });
await check("explore", "/explore", { titleIncludes: "Explore" });
await check("genres index", "/genres", { titleIncludes: "Genres" });
await check("genre romance", "/genres/romance", { titleIncludes: "Romance", ogTitle: "Romance" });
await check("genre thriller", "/genres/thriller", { titleIncludes: "Thriller" });
await check("genre sci-fi-and-fantasy", "/genres/sci-fi-and-fantasy", { titleIncludes: "Fantasy" });
await check("actors index", "/actors", { titleIncludes: "Actor" });
await check("actor Kim Go-eun", "/actors/kim-go-eun", { titleIncludes: "Kim Go-eun", ogTitle: "Kim Go-eun" });
await check("midnight watchlist", "/midnight-watchlist", { titleIncludes: "Midnight Watchlist" });
await check("second lead syndrome", "/second-lead-syndrome", { titleIncludes: "Second Lead" });
await check("emotional damage", "/emotional-damage", { titleIncludes: "Emotional Damage" });
await check("lists", "/lists", { titleIncludes: "Collection" });
await check("about", "/about", { titleIncludes: "About" });
await check("sources", "/sources", { titleIncludes: "Sources" });
await check("privacy", "/privacy", { titleIncludes: "Privacy" });
await check("terms", "/terms", { titleIncludes: "Terms" });

// --- Drama pages ---
await check("drama goblin (tvmaze OG poster)", "/drama/goblin", { titleIncludes: "Goblin", ogTitle: "Goblin", hasOgImage: "tvmaze" });
await check("drama my-mister", "/drama/my-mister", { titleIncludes: "My Mister", ogTitle: "My Mister", hasOgImage: "tvmaze", contains: ["16부작"] });
await check("drama strangers-from-hell (new seed + PINNED)", "/drama/strangers-from-hell", { titleIncludes: "Strangers from Hell", hasOgImage: "tvmaze" });

// --- 404 case ---
await check("unknown genre falls through to SPA", "/genres/__definitely_not_real__", { expectStatus: 200, titleIncludes: "KDramaWorld" });

console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) { console.log(failures.join("\n")); process.exit(1); }
