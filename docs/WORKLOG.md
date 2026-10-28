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

## Hotfix 3–6: validator hardening (commits 0a205f7, 659eb29, ebad4d0, 97a3d31)

After Hotfix 2 deployed, live homepage still showed wrong matches:
- "Crash Landing on You" → AMC "Bunny" (2019 US comedy)
- "Secret Garden" → Smithsonian Channel "Mystery Files" (2010 documentary)
- Several formerly-hardcoded tvmazeIds pointed at non-KR shows (Mouse→RU show, etc.)

Sandbox egress to api.tvmaze.com is blocked, so we couldn't verify each id
individually. Stripped all hardcoded tvmazeIds (Hotfix 3) and rewrote
isKoreanDrama() with defense-in-depth (Hotfix 4/5/6):
1. Hard channel blocklist first (AMC, BBC, HBO, NHK, Smithsonian, …).
2. Reject K-pop/variety channels (V Live, Weverse, Kakao TV).
3. Reject outright if network.country is declared and not KR.
4. Title fuzzy match against curated seed — must share a ≥3-char word token
   OR one title must contain the other. (Hotfix 6 fixed a tokenizer bug
   where spaces were stripped before splitting.)
5. Accept on country==KR or language==korean.
6. Only then fall back to fuzzy keyword scan (tvN, JTBC, korean, …).

Verified live on production: every curated card now shows correct KR title,
network (tvN/SBS/KBS/ENA/Netflix-KR/OCN/jTBC/KBS2/MBC) and year. Goblin page
shows 8.6 TVMaze · 2016 · Ended · Fantasy/Romance. Bundle 236 KB / 73 KB gz.
