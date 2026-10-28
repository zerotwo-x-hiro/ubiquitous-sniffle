/**
 * scripts/screenshot-baseline.ts
 *
 * Take Playwright screenshots of the current build across themes and
 * viewports. Writes images to docs/screenshots/before/ (pre-fix baseline)
 * or docs/screenshots/after/ (post-fix) depending on CLI arg.
 *
 * Usage:
 *   npx tsx scripts/screenshot-baseline.ts before  http://localhost:5173
 *   npx tsx scripts/screenshot-baseline.ts after   https://kdramaworld-v2-1793173646.vercel.app
 */
import { chromium, type Browser, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [phase = "before", baseUrl = "http://localhost:5173"] = process.argv.slice(2);
if (!["before", "after"].includes(phase)) {
  console.error(`phase must be "before" or "after", got "${phase}"`);
  process.exit(1);
}

const OUT = resolve(process.cwd(), `docs/screenshots/${phase}`);
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "mobile", w: 390, h: 844 },
  { name: "tablet", w: 820, h: 1180 },
  { name: "desktop", w: 1440, h: 900 },
];

// Default is dark (the site launches dark). For light we toggle via the
// theme toggle in the nav — selectors discovered empirically below.
const THEMES = [
  { name: "dark", setup: async () => {} },
  {
    name: "light",
    setup: async (page: Page) => {
      // Click theme toggle (button with aria-label containing theme/mode/sun/moon).
      const btn = page.locator('button[aria-label*="mode" i], button[aria-label*="theme" i], button[aria-label*="light" i], button[aria-label*="dark" i]').first();
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(250);
      } else {
        // Fallback: flip data-theme on html.
        await page.evaluate(() => {
          const html = document.documentElement;
          const cur = html.getAttribute("data-theme") || "dark";
          html.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
        });
      }
    },
  },
];

const ROUTES = [
  { path: "/", label: "home" },
  { path: "/explore", label: "explore" },
  { path: "/genres", label: "genres" },
  { path: "/genres/romance", label: "genre-romance" },
  { path: "/genres/thriller", label: "genre-thriller" },
  { path: "/actors", label: "actors" },
  { path: "/drama/my-mister", label: "drama-my-mister" },
  { path: "/drama/goblin", label: "drama-goblin" },
  { path: "/drama/crash-landing-on-you", label: "drama-cloy" },
  { path: "/midnight-watchlist", label: "midnight-watchlist" },
  { path: "/second-lead-syndrome", label: "second-lead" },
  { path: "/emotional-damage", label: "emotional-damage" },
  { path: "/lists", label: "collections" },
  { path: "/about", label: "about" },
  { path: "/sources", label: "sources" },
  { path: "/does-not-exist", label: "404" },
];

const pageErrors: string[] = [];
const consoleErrors: string[] = [];
const failedRequests: Array<{ url: string; status: number | null }> = [];

function attachListeners(page: Page, label: string) {
  page.on("pageerror", (e) => pageErrors.push(`[${label}] ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[${label}] ${msg.text()}`);
  });
  page.on("response", async (res) => {
    const st = res.status();
    if (st >= 400) failedRequests.push({ url: res.url(), status: st });
  });
}

async function gotoAndStabilize(page: Page, url: string) {
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
  // Give shelves time to rehydrate from TVMaze.
  await page.waitForTimeout(2500);
  // Scroll to bottom to trigger any lazy-loading, then back.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  return res;
}

async function main() {
  console.log(`Screenshot baseline (${phase}) → ${OUT}`);
  console.log(`Base URL: ${baseUrl}`);
  const browser: Browser = await chromium.launch();
  const results: Array<{ file: string; path: string; theme: string; viewport: string; ok: boolean; note?: string }> = [];

  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      attachListeners(page, `${theme.name}-${vp.name}`);

      for (const route of ROUTES) {
        const file = `${route.label}-${theme.name}-${vp.name}.png`;
        const full = resolve(OUT, file);
        const url = `${baseUrl.replace(/\/$/, "")}${route.path}`;
        console.log(`  ${file.padEnd(55)} ${url}`);
        try {
          await gotoAndStabilize(page, url);
          await theme.setup(page);
          await page.screenshot({ path: full, fullPage: true });
          results.push({ file, path: route.path, theme: theme.name, viewport: vp.name, ok: true });
        } catch (e) {
          const msg = (e as Error).message;
          console.error(`    FAIL: ${msg}`);
          results.push({ file, path: route.path, theme: theme.name, viewport: vp.name, ok: false, note: msg });
          // Try partial screenshot for diagnosis.
          try {
            await page.screenshot({ path: full.replace(/\.png$/, "-partial.png"), fullPage: false });
          } catch { /* ignore */ }
        }
      }
      await ctx.close();
    }
  }
  await browser.close();

  const report = {
    phase,
    baseUrl,
    generatedAt: new Date().toISOString(),
    pageErrors,
    consoleErrors,
    failedRequests: failedRequests.filter((r) => !/favicon|chrome-extension/i.test(r.url)),
    results,
  };
  writeFileSync(resolve(OUT, "report.json"), JSON.stringify(report, null, 2));
  console.log(`\n--- Report ---`);
  console.log(`Screens: ${results.filter((r) => r.ok).length}/${results.length} ok`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  console.log(`Failed requests (≥400): ${report.failedRequests.length}`);
  if (pageErrors.length || consoleErrors.length) {
    console.log("\nPage errors:", pageErrors.slice(0, 5));
    console.log("Console errors:", consoleErrors.slice(0, 5));
  }
  console.log(`\nReport: ${resolve(OUT, "report.json")}`);
  process.exit(pageErrors.length > 0 ? 2 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
