# WORKLOG — KDramaWorld Audit & Fix

Branch: `improve/audit-and-fix` (from `main` @ `3cfde25`)
Start: 2026-10-28 (Asia/Calcutta)

## Phase 0 — Baseline and Suspect List (in progress)

- [x] Create branch `improve/audit-and-fix` off main
- [x] Install/typecheck/build (sanity)
- [ ] Read every source file
- [ ] Produce `docs/SITE_MAP.md`
- [ ] Verify each suspected problem (a–k) with file:line refs
- [ ] Commit phase 0

## Phase 1 — Automated content audit

- [ ] `scripts/audit-content.ts`
- [ ] Run against TVMaze
- [ ] Produce `docs/CONTENT_AUDIT.md` + `docs/content-audit.json`

## Phase 2 — Full-site test + screenshots

- [ ] Playwright + screenshot script
- [ ] Visit every route in 2 themes × 3 viewports
- [ ] Interactions, network, a11y, perf
- [ ] `docs/TEST_REPORT.md`, `docs/VISUAL_REVIEW.md`

## Phase 3 — Data fixes (highest priority)

- [ ] Canonical catalogue, dedupe, redirects
- [ ] `deriveStatus()` pure function + tests
- [ ] Resolve TVMaze IDs by validation
- [ ] Vercel serverless API layer + cache
- [ ] Live schedule replaces fake 2026 list
- [ ] Source-labelled ratings
- [ ] Remove fake UI (Continue Ep7, hardcoded counts, dead buttons)
- [ ] Rename HanScene → KDramaWorld; fix sources attribution

## Phase 4 — Implement missing pages

- [ ] `/explore`, `/genres`, `/genres/:slug`, `/lists`, `/actors`, `/actors/:slug`
- [ ] Mood tools (Midnight Watchlist, Second Lead, Emotional Damage) with localStorage
- [ ] `/drama/:slug` with cast, episodes, status, ratings, related
- [ ] Proper 404

## Phase 5 — SEO, perf, a11y

- [ ] Per-route meta + JSON-LD
- [ ] Prerender/SSG + sitemap + robots
- [ ] Responsive images, code splitting
- [ ] A11y passes (axe), AA contrast

## Phase 6 — UI polish

- [ ] Light theme rework (warm/hanji)
- [ ] K-theme accents (dancheong bands, Hangul watermarks)
- [ ] Cards/shelves polish
- [ ] `docs/DESIGN_SYSTEM.md`, `docs/KOREAN_COPY.md`

## Phase 7 — Re-test & report

- [ ] Re-run Phase 1 + 2
- [ ] Before/after screenshots
- [ ] All P0/P1 fixed
- [ ] README + .env.example updated
