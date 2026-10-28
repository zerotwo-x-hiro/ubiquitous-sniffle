# Incident: Blank production page — TDZ crash

**Date:** 2026-10-28
**Severity:** P0 — production returned a blank white page.
**Detection:** jsdom repro of the production bundle; confirmed via
`ReferenceError: Cannot access 'fo' before initialization` on module load.

## Root cause

`src/data.ts` declared shelf arrays that called `lookup(slug)` inside a
`Array.prototype.map(...)` at module top level. The `lookup()` helper
closed over arrays (`thrillerExtras`, `fantasyExtras`, `comingSoon`,
`recentlyAdded`) declared later in the same file. ES module `const`
bindings are in the **temporal dead zone** until their declaration runs,
so executing `romanceSlugs.map(lookup)` before `thrillerExtras` was
initialised threw `ReferenceError` at import time. With no error
boundary, React never mounted and `<div id="root">` stayed empty.

Additionally the seed contained a placeholder entry "Queen of Tears
(placeholder — upcoming slate)" which violated the "no fabricated /
placeholder data" content policy, and unknown drama slugs silently
fell back to the featured drama instead of 404ing.

## Fix

1. Restructured `src/data.ts` so that **every canonical Drama object is
   added to a single `D` record first**, then shelves/collections/genres
   are lists of slugs resolved through `resolveSlug()` (safe, never
   throws, warns once in dev). No top-level code references later
   declarations.
2. Removed the "Queen of Tears" placeholder entry and fabricated 2026
   slugs. `comingSoon` is now empty until TVMaze returns real future
   premieres.
3. Added slug redirects for old duplicate slugs; removed slugs map to ""
   → 404.
4. Added `ErrorBoundary` at root + per-route with retry card.
5. Drama page returns a real 404 when `findBySlug` is undefined (no more
   fallback to My Mister); catch-all route is a real 404 page.
6. Added MDL search link (plain text, `rel="noopener noreferrer nofollow"`).

## Prevention

- `tests/validate.seed.test.ts` (14 tests) — module loads without throw,
  no duplicate slugs, no placeholder strings, no future-year entries,
  every shelf slug resolves, no duplicates per shelf, redirects valid.
- `tests/forbidden-sources.test.ts` (all source files) — blocks
  MyDramaList fetch/image/proxy usage.
- `tests/smoke.spec.ts` (Playwright) — boots vite preview and visits
  `/`, `/drama/my-mister`, `/explore`, `/genres`, `/actors`,
  `/midnight-watchlist`, and a 404 URL; asserts non-empty `#root`,
  ≥ 1 `<h1>`, zero `pageerror`, zero `console.error`; asserts
  `/drama/dream-to-you` shows "Drama not found" and not My Mister.
- `.github/workflows/ci.yml` runs typecheck → build → vitest → Playwright
  smoke on every push/PR.

## Lessons

- Never run data-resolution at module top level when it depends on later
  declarations; esbuild/dev can mask TDZ that the prod bundle exposes.
- Single canonical catalogue map; everything else is slug lists.
- Seed integrity checks must be unit tests, not console asserts.
- An ErrorBoundary is mandatory at the root for any production SPA.
