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
  "/discover",
  "/genres",
  "/genres/romance",
  "/genres/thriller",
  "/actors",
  "/actors/kim-go-eun",
  "/lists",
  "/midnight-watchlist",
  "/second-lead-syndrome",
  "/emotional-damage",
  "/about",
  "/sources",
  "/privacy",
  "/terms",
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
  await expect(page.getByRole("heading", { name: "Drama not found" })).toBeVisible({ timeout: 30_000 });
  const body = await page.$eval("body", el => (el as HTMLElement).innerText);
  expect(body).not.toContain("My Mister");
});

test("full TVMaze catalogue loads, is searchable, and opens a direct drama URL", async ({ page }) => {
  await page.goto("/explore", { waitUntil: "domcontentloaded" });
  const catalogSummary = page.locator("p").filter({ hasText: /TVMaze \(\d+ titles/ }).first();
  await expect.poll(async () => {
    const text = (await catalogSummary.textContent()) || "";
    return Number(text.match(/TVMaze \((\d+) titles/)?.[1] || 0);
  }, { timeout: 30_000 }).toBeGreaterThanOrEqual(2000);

  await page.locator("#q").fill("School 2021");
  await expect(page.getByText("School 2021", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await page.goto("/drama/school-2021", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "School 2021" })).toBeVisible({ timeout: 30_000 });
});

test("theme preference persists and mobile navigation remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const getTheme = () => page.locator("html").evaluate((el) => el.classList.contains("light") ? "light" : "dark");
  const before = await getTheme();
  await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
  const after = await getTheme();
  expect(after).not.toBe(before);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(getTheme).toBe(after);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, "mobile layout should not overflow horizontally").toBe(false);
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
});
