import { test, expect } from "@playwright/test";

/**
 * Smoke test: loads critical routes and fails on empty #root, pageerror,
 * console.error, or missing h1. Catches the TDZ class of outage.
 *
 * Run:
 *   npm run build && npm run smoke
 *   PLAYWRIGHT_BASE_URL=https://preview-url npm run smoke
 */

const ROUTES = [
  "/",
  "/drama/my-mister",
  "/explore",
  "/genres",
  "/actors",
  "/midnight-watchlist",
  "/__not_real_404__",
];

for (const path of ROUTES) {
  test(`route ${path} renders without blanking or errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
    page.on("console", msg => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });

    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res).not.toBeNull();

    await page.waitForTimeout(500);

    const rootHtml = await page.$eval("#root", el => (el as HTMLElement).innerHTML);
    expect(rootHtml.length, "#root is not empty").toBeGreaterThan(200);

    const h1Count = await page.locator("h1").count();
    expect(h1Count, "has at least one h1").toBeGreaterThanOrEqual(1);

    expect(errors, `no errors on ${path}`).toEqual([]);
  });
}

test("unknown drama slug shows our 404, not a fallback drama", async ({ page }) => {
  await page.goto("/drama/dream-to-you", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const body = await page.$eval("body", el => (el as HTMLElement).innerText);
  expect(body).toContain("Drama not found");
  expect(body).not.toContain("My Mister");
});
