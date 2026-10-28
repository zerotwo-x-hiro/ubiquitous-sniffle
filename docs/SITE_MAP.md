# KDramaWorld — Site Map

_Branch `improve/audit-and-fix`, generated from source audit._

## Stack

- **Build:** Vite 6 (SPA) · React 18.3 · TypeScript 5.6 · React Router 6.28
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) + hand-authored tokens in `src/index.css`
- **Fonts:** Playfair Display (display) + Inter (UI) from Google Fonts. No KR fallback currently.
- **Themes:** Dark (default) + Light via `src/theme.tsx`; persisted to `localStorage['kdw:theme']`; respects `prefers-color-scheme` on first visit.
- **Data flow:**
  - `src/data.ts` — curated seed catalogue (types `Drama`, `Shelf`, `Actor`, `Genre`, `Collection`, `Minifeature`).
  - `src/api.ts` — TVMaze client (`fetchDramaByTitle`, `fetchRecentKdramas`, `fetchSearchTopKorean`) with in-memory cache. **No API key required**, CORS-enabled. TMDB is not actually used at runtime despite mentions in README/Footer.
  - `src/LiveData.tsx` — `<LiveDataProvider>` react-context that fires ~50 concurrent (batched 4) client-side fetches on mount and progressively replaces seeds; also pulls a dynamic KR web-schedule list for "Recently Released".
- **Deployment:** Vercel, framework=vite, `npm install && npm run build`, output `dist/`, SPA rewrite all routes → `index.html`.

## Routes (`src/App.tsx`)

| Path | Element | Source of data | Notes |
|---|---|---|---|
| `/` | `Home` composed below | seeds + live enrichment | Homepage |
| `/drama/:slug` | `DramaPage` | `useLiveData()` union + backdrop/runtime/IMDb from TVMaze | Dynamic |
| `/explore` | `Placeholder` | — | **Placeholder**, linked from nav/hero/CTAs |
| `/discover` | `Placeholder` | — | **Placeholder** |
| `/genres` | `Placeholder` | — | **Placeholder**, linked from nav |
| `/genres/:slug` | `Placeholder` | — | **Placeholder**, genre tiles link here |
| `/lists` | `Placeholder` | — | **Placeholder**, linked from nav/footer |
| `/actors` | `Placeholder` | — | **Placeholder**, linked from nav/footer |
| `/actors/:slug` | `Placeholder` | — | **Placeholder** |
| `/midnight-watchlist` | `Placeholder` | — | **Placeholder** (MiniFeature card) |
| `/second-lead-syndrome` | `Placeholder` | — | **Placeholder** |
| `/emotional-damage` | `Placeholder` | — | **Placeholder** |
| `/about`, `/sources`, `/privacy`, `/terms` | Catch-all `*` → Placeholder("Coming soon") | — | **Footer links go to 404 placeholder** |
| `*` | Catch-all Placeholder("Coming soon") | — | Generic "still being written" |

## Home composition (`src/App.tsx` → `Home()`, in render order)

| Order | Section | Component | File | Data |
|---|---|---|---|---|
| 0 | Sticky nav | `Nav` | `components/Nav.tsx` | Static links, theme toggle, fake Search(⌘K) + Sign-in buttons (no handlers) |
| 1 | Hero | `Hero` | `components/Hero.tsx` | `featured` from LiveData; live backdrop + poster + rating |
| 2 | Discover shelf | `Shelf` | `components/Shelf.tsx` | 12 curated dramas |
| 3 | Recently Released shelf | `Shelf` | `components/Shelf.tsx` | **Dynamic** from TVMaze KR web schedule; falls back to curated `recent` list |
| 4 | Romance shelf | `Shelf` | `components/Shelf.tsx` | 8 seeds (some overlap with discover) |
| 5 | Thriller shelf | `Shelf` | `components/Shelf.tsx` | 8 seeds |
| 6 | Fantasy shelf | `Shelf` | `components/Shelf.tsx` | 8 seeds (contains duplicate slugs) |
| 7 | Top Rated | `TopRated` | `components/TopRated.tsx` | Sorted union of discover, numbered 01–12 |
| 8 | Coming Soon | `ComingSoon` | `components/ComingSoon.tsx` | `comingSoon` seed list (all 2026, TBA) |
| 9 | Actors carousel | `Actors` | `components/Actors.tsx` | Hardcoded `actors[]`, 8 names |
| 10 | Genre grid | `Genres` | `components/Genres.tsx` | Hardcoded `genres[]` with static counts (1168, 808, …) |
| 11 | Collections | `Collections` | `components/Collections.tsx` | 3 editorial collections × 5 items; shows "avg ★" computed from (possibly zero) ratings |
| 12 | Mini-features | `MiniFeatures` | `components/MiniFeatures.tsx` | 3 cards linking to `/midnight-watchlist`, `/second-lead-syndrome`, `/emotional-damage` |
| 13 | Fresh in the archive | `RecentlyAdded` | `components/RecentlyAdded.tsx` | 6 hardcoded `recentlyAdded[]` seeds |
| 14 | Promise block | `Promise` | `components/Promise.tsx` | Static copy — claims "Sourced ratings: TMDB & TVMaze, no invented scores" |
| 15 | Footer | `Footer` | `components/Footer.tsx` | Static columns; newsletter `<form>` preventDefault only (submit does nothing) |

## Reusable components

| Component | Props | Role |
|---|---|---|
| `Poster` | `{ drama, className?, showTitle?, size? }` | Renders TVMaze image if present, else `.art-a`…`.art-h` gradient fallback; rating pill, network badge, title plate |
| `DramaCard` | `{ drama, compact? }` | Glass card wrapping Poster + title/year/genres/rating; links to `/drama/:slug` |
| `Shelf` | `{ shelf: { id, title, eyebrow?, items[] } }` | Titled horizontal-scroll row of DramaCards |

## API module (`src/api.ts`)

### Types
- `TvMazeShow`, `EnrichedDrama (extends Drama)` with `poster`, `backdrop`, `imdbId`, `status`, `runtime`, `summaryText`, `tvmazeId`, `fetchError`.

### Functions
| Export | Endpoint / behaviour |
|---|---|
| `fetchDramaByTitle(seed, {episodes?})` | `GET /singlesearch/shows?q=<title>`; optionally `?embed=episodes`. Strips HTML, normalises rating/year/network/genres. Graceful catch returns seed on failure. |
| `fetchRecentKdramas(limit=12)` | Fetches `/schedule/web?date=YYYY-MM-DD&country=KR` for −21…+14 days (35 windows × 5-concurrent batches), filters by KR country or drama genre, falls back to `fetchSearchTopKorean`. |
| `fetchSearchTopKorean(limit=12)` | `/search/shows?q=…` for 3 hardcoded queries (`korean drama`, `k-drama romance`, `korean thriller drama`). |
| `pickArtByTitle(title)` | Deterministic palette picker (djb2 hash mod 8) for posters without an image. |
| `getDramaCached(seed)` / `getRecentCached(limit)` | Module-level Promise-keyed cache (cleared on reload). |

### Batching
`LiveDataProvider` enriches the deduped ~55 seeds in batches of 4 parallel `singlesearch` requests on mount — roughly 14 round-trips just to hydrate the homepage. There is no persistent cache, no retry/backoff, no 429 handling.

## Data catalogue — seeds (`src/data.ts`)

Counts (pre-dedupe):

- `featured` — 1 (My Mister)
- `discover` — 12
- `recent` — 8 (the "2026 slate"; some titles/ratings are fictional)
- `romance` — 8 (3 aliased from `discover`)
- `thrillers` — 8
- `fantasy` — 8 (contains `moon-lovers-f`, `kingdom-f`, `tunnel-f` which are duplicates of romance/thriller entries)
- `topRated` — derived from `discover`, sorted desc by rating, 12 items
- `comingSoon` — 8 (fictional/curated 2026 slate)
- `actors` — 8 (with hardcoded drama counts: 20, 19, 19, 18, 18, 17, 16, 15)
- `genres` — 8 (with hardcoded counts)
- `collections` — 3 × 5 = 15 (entries suffixed `-c`, `-gem` to avoid slug collisions with discover)
- `recentlyAdded` — 6 (curated "Recently added" grid)
- `minifeatures` — 3

## Duplicate slugs (same show, different slug)

Pre-dedupe duplicates found by inspection in `src/data.ts`:

- Moon Lovers → `moon-lovers` (romance) / `moon-lovers-f` (fantasy)
- Kingdom → `kingdom` (thriller) / `kingdom-f` (fantasy)
- Tunnel → `tunnel-thriller` (thriller) / `tunnel-f` (fantasy)
- My Mister → `my-mister` / `my-mister-c`
- Reply 1988 → `reply-1988` / `reply-1988-c`
- Mr. Sunshine → `mr-sunshine` / `mr-sunshine-c`
- Signal → `signal` / `signal-c`
- Twinkling Watermelon → `twinkling-watermelon` / `twinkling-watermelon-gem`
- Chicago Typewriter → `chicago-typewriter` / `chicago-typewriter-gem`
- Business Proposal → `business-proposal` / `business-proposal-c`
- Dream to You → `dream-to-you` (recent) / `dream-to-you-cs` (comingSoon)
- 100 Days of Deception → `100-days-of-deception` (recent) / `100-days-of-deception-cs` (comingSoon)

Total unique shows ≈ 44 after canonicalisation (needs Phase-3 resolver to confirm).

## Entry points

- `index.html` — loads `/src/main.tsx`, sets `<title>KDramaWorld — Your World of Korean Dramas</title>` (one title for all routes), generic description.
- `src/main.tsx` — mounts `<ThemeProvider><BrowserRouter><LiveDataProvider><App/></LiveDataProvider></BrowserRouter></ThemeProvider>`.

## Vercel

- `vercel.json`: rewrites `/(.*)` → `/index.html` (SPA). No CSP headers, no caching overrides.
- No serverless API routes (`api/` directory does not exist yet).
