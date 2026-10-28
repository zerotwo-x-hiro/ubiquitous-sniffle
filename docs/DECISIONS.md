# DECISIONS

_Record of architectural & product decisions made during the audit-and-fix pass._

## Phase 0 — Baseline

### D-001 Single source of truth for data
There will be one **canonical catalogue** generated at build/sync time
(`src/data/catalog.json`) keyed by TVMaze id (with TMDB/OMDb merges when keys
are provided). `src/data.ts` will keep seed slugs + human editorial picks
(collections, curated lists, order) but will reference canonical ids rather
than duplicate Drama objects. Duplicate `*-f`, `*-c`, `*-cs`, `*-gem` slugs
become client-side redirects in the router to a single canonical URL.

### D-002 TVMaze is the default metadata source; others are optional
TVMaze is free, keyless, CORS-enabled, and already partially integrated — so
it stays as the default. TMDB access token (`TMDB_ACCESS_TOKEN`) and OMDb API
key (`OMDB_API_KEY`) are **optional** env vars used server-side only to enrich
posters/ratings/cast. If not set, the site still works 100% off TVMaze.

### D-003 No fabricated data. Ever.
Ratings, years, episode counts, networks, statuses, counts and "user" state
come from a real source, or they are labelled "Not rated" / "TBA" / hidden.
Hardcoded 2026 unreleased ratings (9.4, 9.3) and "Continue Ep 7, 43 min left"
anonymous-user progress are removed until there is real localStorage-backed
user progress.

### D-004 Client → Vercel serverless layer instead of direct TVMaze calls
Client will call `/api/catalog`, `/api/schedule`, `/api/show/:id` etc. which
fetch TVMaze (and optional TMDB/OMDb) server-side with retries/backoff and
return trimmed JSON with `Cache-Control: s-maxage=3600,
stale-while-revalidate=86400`. This cuts ~50 client requests to 1-2 cached
requests, prevents 429/leak of optional keys, and lets us add cron-driven
revalidation.

### D-005 Status derived by a pure function `deriveStatus(show, now, tz)`
Airing / upcoming / ended determined from real premiere + episode air
dates + TVMaze status. Used everywhere a status badge appears. Unit tests
cover KST-midnight boundaries (Asia/Seoul). An unreleased drama cannot show a
rating; an ended drama cannot appear in Coming Soon.

### D-006 Safe TVMaze matching
Title search can match the wrong non-Korean show. Matching will require
language=Korean or country=KR and a year ±1 tolerance; unresolved titles
raise explicit errors in the audit script and will be mapped by hand in
`src/data/catalog.overrides.json` so runtime never guesses.

### D-007 Feature parity: nav/footer/home links must land on real pages
Before launch, every linked route from nav/footer/home/CTAs is either
implemented or removed from the navigation. No placeholder pages stay
linked in production.

### D-008 Identity: rename "HanScene" → "KDramaWorld" everywhere.
The Footer/collections use "HanScene Favorites"; that was a placeholder.
The brand is KDramaWorld. Footer copy, README and metadata updated
accordingly. Source attribution text ("Metadata © TMDB & TVMaze") is changed
to match what we actually use (TVMaze, plus TMDB/OMDb if keys configured).

### D-009 Hangul/K-theme accents are original artwork (no Taegeuk, no real logos)
We can use dancheong-style color bands, subtle Hangul watermarks (사랑,
이야기), bilingual labels ("방영 중 · Airing Now"), and hanok-window
framing — but never the Korean national flag, real network logos (tvN,
SBS etc. are text only) or copyrighted imagery.

### D-010 Light theme is designed, not inverted
The current light theme is a dark-theme inversion with poor contrast on
posters/text-over-gradients. Phase 6 redesigns light mode around warm
"hanji paper" cream tones (#f7f3ec), soft ink shadows and deeper accents.
Both themes must pass WCAG AA (4.5:1 body, 3:1 large text).
