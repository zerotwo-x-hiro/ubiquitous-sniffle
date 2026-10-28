/**
 * scripts/dom-baseline.ts
 *
 * Fallback baseline capture when Playwright Chromium isn't available.
 * For each route, fetches the rendered HTML (server-side index + JS bundle)
 * and writes:
 *   - <route>.html        : fetched HTML (SSR shell)
 *   - <route>-meta.txt    : HTTP status, content-type, size, h1 count, etc.
 *
 * Intended as a cheap before/after snapshot; full screenshots require a
 * real browser (see scripts/screenshot-baseline.ts).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const [phase = "before", baseUrl = "http://localhost:5173"] = process.argv.slice(2);
const OUT = resolve(process.cwd(), `docs/screenshots/${phase}`);
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "/", "/explore", "/genres", "/genres/romance", "/genres/thriller",
  "/actors", "/drama/my-mister", "/drama/goblin", "/drama/crash-landing-on-you",
  "/midnight-watchlist", "/second-lead-syndrome", "/emotional-damage",
  "/lists", "/about", "/sources", "/does-not-exist",
];

const reports: Record<string, unknown>[] = [];
for (const r of ROUTES) {
  const url = baseUrl.replace(/\/$/, "") + r;
  const safe = r.replace(/\//g, "_").replace(/^_/, "") || "home";
  try {
    const res = await fetch(url);
    const html = await res.text();
    writeFileSync(resolve(OUT, `${safe}.html`), html);
    // quick stats
    const h1 = (html.match(/<h1[^>]*>/gi) || []).length;
    const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || "";
    const root = html.includes('id="root"');
    const bundleRefs = [...html.matchAll(/(index-[a-zA-Z0-9_-]+\.(?:js|css))/g)].map((m) => m[1]);
    const blank = html.includes('id="root"></div>') || html.includes('id="root" />');
    const meta = `URL: ${url}\nStatus: ${res.status}\nTitle: ${title}\nBytes: ${html.length}\n<h1> count: ${h1}\n#root present: ${root}\n#root blank: ${blank}\nBundles: ${bundleRefs.join(", ") || "none"}`;
    writeFileSync(resolve(OUT, `${safe}-meta.txt`), meta);
    reports.push({ route: r, status: res.status, title, bytes: html.length, h1, root, blank, bundles: bundleRefs });
    console.log(`${res.status} ${r.padEnd(30)} ${html.length} bytes h1=${h1} blank=${blank}`);
  } catch (e) {
    console.error(`FAIL ${r}:`, (e as Error).message);
    reports.push({ route: r, error: (e as Error).message });
  }
}

writeFileSync(resolve(OUT, "dom-report.json"), JSON.stringify({ phase, baseUrl, generatedAt: new Date().toISOString(), routes: reports }, null, 2));
console.log(`\nWrote ${OUT}/dom-report.json`);
