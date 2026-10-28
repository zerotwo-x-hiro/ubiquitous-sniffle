// Live K-Drama data fetched from the TVMaze public API (https://www.tvmaze.com/api).
// No API key required; CORS is enabled from browsers.
//
// We query the TVMaze /singlesearch/shows endpoint per slug and normalise the
// result into our Drama shape so existing UI components (Poster, DramaCard,
// Hero, Shelves, DramaPage, …) work unchanged.

import type { Drama } from "./data";

/** TVMaze normalised show shape (only fields we use). */
export type TvMazeShow = {
  id: number;
  name: string;
  summary?: string | null;
  premiered?: string | null;
  ended?: string | null;
  type?: string | null;
  status?: string | null;
  runtime?: number | null;
  averageRuntime?: number | null;
  genres?: string[] | null;
  network?: { name?: string | null; country?: { code?: string | null; name?: string | null } | null } | null;
  webChannel?: { name?: string | null; country?: { code?: string | null; name?: string | null } | null } | null;
  language?: string | null;
  rating?: { average?: number | null } | null;
  image?: { medium?: string | null; original?: string | null } | null;
  externals?: { tvrage?: number | null; thetvdb?: number | null; imdb?: string | null } | null;
  _embedded?: { episodes?: Array<{ id: number; name: string; season: number; number: number; airdate?: string }> } | null;
};

export type EnrichedDrama = Drama & {
  tvmazeId?: number;
  poster?: string;       // medium image (350×495-ish)
  backdrop?: string;     // original image (TMDB when available, else TVMaze original)
  tmdbPoster?: string;   // TMDB alternative poster (higher res than TVMaze)
  tagline?: string;      // TMDB tagline
  imdbId?: string;
  imdbRating?: number;   // IMDb audience rating (only when ≥ 5,000 votes)
  imdbVotes?: number;    // IMDb vote count
  status?: string;
  runtime?: number;
  summaryText?: string;  // HTML stripped for blurb
  fetchError?: string;
  _needsImageRefetch?: number; // internal: tvmaze id to fetch image for if initial hit lacked it
};

/** Result shape of /api/enrich/shows/:tvmazeId — server-side TMDB+OMDb merge. */
export type ServerEnrich = {
  tvmazeId: number;
  imdbId: string | null;
  tmdbId: number | null;
  backdrop: string | null;
  poster: string | null;
  tmdbPoster: string | null;
  tagline: string | null;
  overview: string | null;
  imdbRating: number | null;
  imdbVotes: number | null;
  sources: { tmdb: { keySource: string; id: number } | null; omdb: { keySource: string } | null };
  warnings: string[];
  ms: number;
};

const BASE = "/api/tvmaze";

/** Strip HTML tags returned in TVMaze summary fields. */
function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Year from a "YYYY-MM-DD" string. */
function yearFrom(dateStr?: string | null): number | undefined {
  if (!dateStr) return undefined;
  const y = parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(y) ? y : undefined;
}

/** Pick a network label preferring broadcast networks over web channels. */
function pickNetwork(show: TvMazeShow): string | undefined {
  const n = show.network?.name;
  const w = show.webChannel?.name;
  return n || w || undefined;
}

/** Convert a TVMaze rating (out of 10, often using 6–9 range) to our 0-10 scale.
 *  TVMaze averages can be lower than other sites; we keep them as-is for honesty. */
function pickRating(show: TvMazeShow): number {
  const r = show.rating?.average;
  if (typeof r !== "number" || !Number.isFinite(r)) return 0;
  return Math.round(r * 10) / 10;
}

/** Normalise a title for fuzzy comparison (lowercase, strip non-alphanumeric). */
function normTitle(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}

/** Split title into normalised word tokens (>=3 chars). */
function titleTokens(s: string): string[] {
  return (s || "").toLowerCase().split(/[^a-z0-9가-힣]+/).filter((t) => t.length >= 3);
}

/** True when a TVMaze show is likely the Korean drama we want. */
function isKoreanDrama(show: TvMazeShow, seed?: Drama): boolean {
  const cc = show.network?.country?.code ?? show.webChannel?.country?.code;
  const chan = (show.network?.name || show.webChannel?.name || "").toLowerCase();
  const lang = (show.language || "").toLowerCase();
  const genres = (show.genres || []).map((g) => g.toLowerCase());

  // Hard blocklist of non-Korean channels/studios (takes precedence).
  if (/(^|\W)(at-x|tokyo mx|nhk|fuji tv|tbs|mbs|abema|wowow|bbc|itv|comedy central|amc|disney\+|hbo|showtime|oxygen|tnt|zdf|hot3|tv3|show tv|ozone|netflix us|hulu|apple tv\+|smithsonian|history channel|national geographic|cnn|comedy\.tv)($|\W)/.test(chan)) return false;
  // K-pop / variety channels.
  if (/(vlive|weverse|v live|kakao tv)/.test(chan)) return false;

  // Reject non-scripted TVMaze show types outright. TVMaze sets
  // type="Award Show"|Reality|Talk Show|News|Sports Event|Game Show|Variety
  // on one-off / non-scripted content (e.g. "Korea Drama Awards" comes back
  // with genres:["Drama"] but type:"Award Show").
  const showType = (show.type || "").toLowerCase();
  if (showType && showType !== "scripted") {
    // Explicit non-scripted types always reject (Award Show, Reality, etc.).
    return false;
  }

  // Reject non-drama genres: reality/variety/talk/music/game-show/family-kids
  // (prevents matching variety shows like jTBC's "Night Goblin" against
  // searches for the drama "Goblin").
  if (genres.some((g) => /reality|variety|talk.show|game.show|music|children|family|news|documentary/i.test(g))) return false;

  // Must claim "Drama" as one of its genres (or have no genres populated, which
  // we accept in case of incomplete records — KR country/language will gate it).
  if (genres.length > 0 && !genres.some((g) => /drama/i.test(g))) {
    // Allow fantasy/romance/crime/thriller/mystery/action/horror/comedy/medical/legal/historical/sports/supernatural — these
    // frequently appear alongside drama in K-show genre tagging.
    const dramaAdjacent = /fantasy|romance|crime|thriller|mystery|action|horror|comedy|medical|legal|historical|sports|supernatural|adventure/;
    if (!genres.some((g) => dramaAdjacent.test(g))) return false;
  }

  // If country code is declared and it's NOT KR -> reject outright.
  if (cc && cc !== "KR") return false;

  // Title sanity: if seed title is provided, require the returned TVMaze show
  // name to have strong lexical overlap. /search/shows returns many results,
  // and a single shared word like "goblin" can match the wrong show (e.g.
  // jTBC variety "Night Goblin" vs tvN drama "Goblin").
  if (seed && show.name) {
    const aNorm = normTitle(seed.title);
    const bNorm = normTitle(show.name);
    const aToks = titleTokens(seed.title);
    const bToks = titleTokens(show.name);
    const bSet = new Set(bToks);
    const sharedTok = aToks.filter((t) => bSet.has(t) && t.length >= 3);
    const contains = aNorm.length >= 3 && bNorm.length >= 3 && (aNorm.includes(bNorm) || bNorm.includes(aNorm));
    // Single-word seed titles (like "Goblin", "Signal", "Mouse", "Kingdom", "Healer", "Tunnel")
    // are the collision-prone ones: require the result's title to be short enough
    // that it's clearly the same show, OR share the word AND not have extra
    // distinguishing content words we don't expect. If the result's title is
    // much longer than the seed and doesn't contain the seed in it, reject.
    if (aToks.length <= 1) {
      // Single-word seed: require the TVMaze title to be essentially "Goblin" (or
      // "[adjective] Goblin" with the leading token being an article/episode word).
      // We accept if (a) the exact seed title is a substring of the result title
      // AND the result title isn't padded with extra content words that would
      // indicate a different show (e.g. "Night Goblin", "Goblin Slayer").
      const seedW = aNorm;
      const resultHasExtra = bToks.some((t) => t !== seedW && t.length >= 4 && !/^the$|^a$|^of$|^and$|^in$|^ii$|^iii$/.test(t));
      if (resultHasExtra && !(bNorm.startsWith(seedW) && bToks.length <= 2)) {
        // Even tighter: for single-word seeds, exact normalized title match
        // OR substring match where the seed appears at the start AND the total
        // length ratio is close. Night Goblin = "nightgoblin" (11) vs "goblin" (6):
        // ratio 1.83 > 1.4 → reject.
        const ratio = bNorm.length / Math.max(aNorm.length, 1);
        if (ratio > 1.4) return false;
      }
      // Also require shared token.
      if (!sharedTok.length && !contains) return false;
    } else {
      // Multi-word seed: share at least one substantive (>=4 char) token OR contain.
      const bigShared = sharedTok.some((t) => t.length >= 4);
      if (!bigShared && !contains && aNorm.length >= 5 && bNorm.length >= 5) return false;
    }
  }

  // Accept: official country == KR OR language == Korean.
  if (cc === "KR") return true;
  if (lang === "korean") return true;

  // Fuzzy: name/summary contains an unmistakable Korean keyword.
  const blob = (show.name + " " + stripHtml(show.summary)).toLowerCase();
  if (/\b(korean|k-drama|kdrama|south korea)\b/.test(blob)) return true;
  if (/\b(kbs|sbs|mbc|tvn|jtbc|ocn|tving|wavve|kakao|ena|netflix korea)\b/.test(blob)) return true;

  return false;
}

/** Year-distance sanity: reject if TVMaze year differs by more than 2 years
 *  from seed year (unless seed year is explicitly a placeholder 0). */
function yearMatches(show: TvMazeShow, seedYear: number): boolean {
  const y = yearFrom(show.premiered);
  if (!y) return true;
  if (!seedYear) return true;
  return Math.abs(y - seedYear) <= 2;
}

/** Given a curated seed Drama, enrich it with live TVMaze data when found. */
export async function fetchDramaByTitle(seed: Drama, options?: { episodes?: boolean }): Promise<EnrichedDrama> {
  const { episodes = false } = options ?? {};

  // Try multiple endpoints in order: /shows/:id (if seed has one), /singlesearch
  // (best-effort top hit), and /search (array of matches). /singlesearch returns
  // a stripped record (no image) for some popular shows, so we always consider
  // the /search list and pick the best-validated candidate; we also run a
  // follow-up /shows/:id hydrate if the winning match lacks a poster.
  // Specify `specials=1&embed=episodes` isn't needed for images — but we add
  // no `images` embed; we rely on the show.image field that TVMaze returns on
  // /shows/:id. For /singlesearch and /search, images ARE included when present.
  const urls: string[] = [];
  if (typeof seed.tvmazeId === "number" && seed.tvmazeId > 0) {
    // Always embed episodes when requested; always add ?embed=episodes OR
    // plain; we also append nothing here — TVMaze always returns show.image
    // on the /shows/:id endpoint, but we will also explicitly re-hydrate via
    // hydratePosterIfMissing if poster is missing.
    const qs = episodes ? "?embed=episodes" : "";
    urls.push(`${BASE}/shows/${seed.tvmazeId}${qs}`);
  }
  // Always ask /singlesearch with no embed first (faster); then /search for the
  // list; finally /shows/:id lookup by the ID we discover, as a hydrate step.
  const singleParams = new URLSearchParams({ q: seed.title });
  if (episodes) singleParams.set("embed", "episodes");
  urls.push(`${BASE}/singlesearch/shows?${singleParams.toString()}`);
  urls.push(`${BASE}/search/shows?q=${encodeURIComponent(seed.title)}`);

  let best: EnrichedDrama | null = null;
  let lastErr: Error | null = null;

  function scoreCandidate(e: EnrichedDrama): number {
    // Heavily prefer results that have a poster. Network, summary, rating are
    // tie-breakers. Poster MUST be present for the candidate to beat one that
    // does — a title+rating without a real image is never better than a real
    // image match (we fall back to gradient posters only when everything fails).
    return (e.poster ? 10_000 : 0) + (e.network ? 100 : 0) + (e.summaryText ? 10 : 0) + (e.rating > 0 ? 2 : 0) + (e.backdrop ? 1 : 0);
  }

  function consider(show: TvMazeShow) {
    if (!show?.id) return;
    // If this show was reached via an explicit seed.tvmazeId match, trust it
    // directly (we seeded that ID intentionally to bypass fuzzy matching for
    // canonical titles like Guardian: The Lonely and Great God / "Goblin").
    const trusted = typeof seed.tvmazeId === "number" && seed.tvmazeId > 0 && show.id === seed.tvmazeId;
    if (!trusted) {
      if (!isKoreanDrama(show, seed)) return;
      if (!yearMatches(show, seed.year)) return;
    }
    const merged = mergeShow(seed, show, episodes);
    const cur = best as EnrichedDrama | null;
    if (!cur || scoreCandidate(merged) > scoreCandidate(cur)) best = merged;
  }

  for (const url of urls) {
    // Once we have a candidate with a poster + network, we can stop early to
    // save requests (but still finish the in-flight batch).
    const cur = best as EnrichedDrama | null;
    if (cur && cur.poster && cur.network) break;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        if (res.status !== 404) lastErr = new Error(`TVMaze ${res.status}`);
        continue;
      }
      const payload = await res.json();
      if (Array.isArray(payload)) {
        for (const it of payload) consider(it?.show);
      } else {
        consider(payload);
      }
    } catch (e) {
      lastErr = e as Error;
    }
  }

  if (!best) return { ...seed, fetchError: lastErr?.message } as EnrichedDrama;

  // If best candidate lacks a poster, hydrate via /shows/:id (full record).
  const hydrated = await hydratePosterIfMissing(best);
  return hydrated;
}

function mergeShow(seed: Drama, show: TvMazeShow, episodes: boolean): EnrichedDrama {
  const year = yearFrom(show.premiered) ?? seed.year;
  const runtime = show.averageRuntime ?? show.runtime;
  const epCount = show._embedded?.episodes?.length;
  const summary = stripHtml(show.summary);
  const trusted = typeof seed.tvmazeId === "number" && seed.tvmazeId > 0 && show.id === seed.tvmazeId;
  // For trusted (curated-tvmazeId) seeds, keep the seed title so common English
  // titles like "Goblin" (canonically "Guardian: The Lonely and Great God")
  // stay as users expect them in shelves/headers. For fuzzy matches, prefer
  // TVMaze's title since it's the one we matched against.
  const title = trusted ? seed.title : (show.name || seed.title);
  // Keep seed rating if TVMaze returns 0 (some legacy shows show null even
  // though they have a well-known community rating; seed is our curated value).
  const tvRating = pickRating(show);
  const rating = tvRating > 0 ? tvRating : (seed.rating || 0);
  // Same for genres/blurb/network — prefer TVMaze, fall back to seed.
  return {
    ...seed,
    title,
    year,
    rating,
    episodes: epCount ?? seed.episodes,
    genres: show.genres && show.genres.length ? show.genres : seed.genres,
    blurb: summary ? summary.slice(0, 280) + (summary.length > 280 ? "…" : "") : seed.blurb,
    network: pickNetwork(show) ?? seed.network,
    status: show.status ?? undefined,
    runtime: runtime ?? undefined,
    tvmazeId: show.id,
    poster: show.image?.medium ?? undefined,
    backdrop: show.image?.original ?? undefined,
    imdbId: show.externals?.imdb ?? undefined,
    summaryText: summary || undefined,
  };
}

/** If a merged result is missing its poster (because /singlesearch returned a
 *  stripped record), fetch the canonical /shows/:id record which always has
 *  images and patch the poster/backdrop fields. Returns the input unchanged if
 *  it already has a poster or the refetch fails. */
async function hydratePosterIfMissing(e: EnrichedDrama): Promise<EnrichedDrama> {
  if (e.poster || !e.tvmazeId) return e;
  try {
    const res = await fetch(`${BASE}/shows/${e.tvmazeId}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return e;
    const full: TvMazeShow = await res.json();
    return {
      ...e,
      poster: full.image?.medium ?? e.poster,
      backdrop: full.image?.original ?? e.backdrop,
    };
  } catch {
    return e;
  }
}

/** Fetch the top N popular/premiering K-dramas from TVMaze schedule for
 *  shelf filling (used for the "Recently Released" / "New" shelves). */
export async function fetchRecentKdramas(limit = 12): Promise<EnrichedDrama[]> {
  // Pull the worldwide web/TV schedule for the last 30 days + next 14 days
  // then filter to Korean-origin shows (genres include "Drama" + country KR).
  const today = new Date();
  const out: EnrichedDrama[] = [];
  const seen = new Set<number>();

  // Helper: fetch schedule for a date YYYY-MM-DD (US date but covers global web premieres)
  async function fetchDate(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const url = `${BASE}/schedule/web?date=${yyyy}-${mm}-${dd}&country=KR`;
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const items = await res.json();
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  }

  // Pull a couple of date windows (KR web schedule + international web)
  const windows: Date[] = [];
  for (let i = -21; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    windows.push(d);
  }

  // Limit concurrency to be polite
  const BATCH = 5;
  for (let i = 0; i < windows.length; i += BATCH) {
    const batch = windows.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(fetchDate));
    for (const day of results) {
      for (const entry of day) {
        const show: TvMazeShow | undefined = entry?._embedded?.show ?? entry?.show;
        if (!show?.id || seen.has(show.id)) continue;
        // Keep only genuine K-dramas: KR country or Korean language AND drama genre,
        // reject known K-pop/variety channel content (V Live, Weverse, etc.)
        const chan = (show.network?.name || show.webChannel?.name || "").toLowerCase();
        const isKPopChannel = /(vlive|weverse|v live|kakao tv)/.test(chan);
        const showType = (show.type || "").toLowerCase();
        const isNonScripted = showType && showType !== "scripted";
        const isReality = (show.genres || []).some((g: string) => /reality|variety|talk|music|game.show|news|documentary/i.test(g));
        const isKorean =
          (show.network?.country?.code === "KR" ||
           show.webChannel?.country?.code === "KR" ||
           (show.language || "").toLowerCase() === "korean");
        const isDrama = (show.genres || []).some((g: string) => /drama/i.test(g));
        if (isKPopChannel || isNonScripted || isReality || !(isKorean && isDrama)) continue;
        seen.add(show.id);

        const summary = stripHtml(show.summary);
        const year = yearFrom(show.premiered) ?? new Date().getFullYear();
        out.push({
          slug: `tvmaze-${show.id}`,
          title: show.name || "Untitled",
          year,
          rating: pickRating(show),
          episodes: undefined,
          genres: show.genres?.length ? show.genres : ["Drama"],
          blurb: summary ? summary.slice(0, 240) + (summary.length > 240 ? "…" : "") : `A ${year} K-drama.`,
          art: pickArtByTitle(show.name || ""),
          network: pickNetwork(show),
          tvmazeId: show.id,
          poster: show.image?.medium ?? undefined,
          backdrop: show.image?.original ?? undefined,
          status: show.status ?? undefined,
          runtime: show.averageRuntime ?? show.runtime ?? undefined,
          summaryText: summary || undefined,
          isNew: (show.status || "").toLowerCase() === "running",
        });
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
    }
    if (out.length >= limit) break;
  }

  // Fallback to search if schedule was sparse
  if (out.length < 6) {
    const fallbacks = await fetchSearchTopKorean(limit);
    for (const s of fallbacks) {
      if (!seen.has(s.tvmazeId!)) {
        out.push(s);
        if (out.length >= limit) break;
      }
    }
  }

  return out;
}

/** Keyword search fallback — picks top-rated K-drama results. */
export async function fetchSearchTopKorean(limit = 12): Promise<EnrichedDrama[]> {
  const queries = ["korean drama", "k-drama romance", "korean thriller drama"];
  const out: EnrichedDrama[] = [];
  const seen = new Set<number>();
  for (const q of queries) {
    try {
      const res = await fetch(`${BASE}/search/shows?q=${encodeURIComponent(q)}`);
      if (!res.ok) continue;
      const items = await res.json();
      if (!Array.isArray(items)) continue;
      for (const it of items) {
        const show: TvMazeShow | undefined = it.show;
        if (!show?.id || seen.has(show.id)) continue;
        const showType = (show.type || "").toLowerCase();
        if (showType && showType !== "scripted") continue;
        seen.add(show.id);
        const summary = stripHtml(show.summary);
        const year = yearFrom(show.premiered) ?? new Date().getFullYear();
        out.push({
          slug: `tvmaze-${show.id}`,
          title: show.name || "Untitled",
          year,
          rating: pickRating(show),
          genres: show.genres?.length ? show.genres : ["Drama"],
          blurb: summary ? summary.slice(0, 240) + (summary.length > 240 ? "…" : "") : "",
          art: pickArtByTitle(show.name || ""),
          network: pickNetwork(show),
          tvmazeId: show.id,
          poster: show.image?.medium ?? undefined,
          backdrop: show.image?.original ?? undefined,
          status: show.status ?? undefined,
          runtime: show.averageRuntime ?? show.runtime ?? undefined,
          summaryText: summary || undefined,
        });
        if (out.length >= limit) return out;
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

/** Stable palette picker by title so fallback gradients stay consistent. */
export function pickArtByTitle(title: string): string {
  const arts = ["art-a", "art-b", "art-c", "art-d", "art-e", "art-f", "art-g", "art-h"] as const;
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return arts[h % arts.length];
}

/** Slugify a title to make stable, URL-safe slugs for newly fetched shows. */
export function slugifyTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Generate a fake slug from a TVMaze ID + title (used for dynamic drama pages). */
export function makeSlug(show: TvMazeShow): string {
  return `${slugifyTitle(show.name || `show-${show.id}`)}-${show.id}`;
}

/** In-memory cache so we don't hammer TVMaze on every navigation. */
const cache = new Map<string, Promise<EnrichedDrama>>();
const listCache = new Map<string, Promise<EnrichedDrama[]>>();

export function getDramaCached(seed: Drama): Promise<EnrichedDrama> {
  const key = seed.slug;
  if (!cache.has(key)) cache.set(key, fetchDramaByTitle(seed));
  return cache.get(key)!;
}

export function getRecentCached(limit = 12): Promise<EnrichedDrama[]> {
  const key = `recent-${limit}`;
  if (!listCache.has(key)) listCache.set(key, fetchRecentKdramas(limit));
  return listCache.get(key)!;
}

/** Fetch supplementary TMDB/OMDb data (backdrop, TMDB poster, IMDb rating)
 *  for a drama that already has a tvmazeId. Returns null if the endpoint
 *  fails or the drama has no tvmazeId. Called client-side, opt-in; missing
 *  data degrades gracefully (TVMaze backdrop + no IMDb pill). */
const enrichCache = new Map<number, Promise<ServerEnrich | null>>();
export function fetchSupplemental(tvmazeId: number | undefined): Promise<ServerEnrich | null> {
  if (!tvmazeId) return Promise.resolve(null);
  if (enrichCache.has(tvmazeId)) return enrichCache.get(tvmazeId)!;
  const p = (async () => {
    try {
      const r = await fetch(`/api/enrich/shows/${tvmazeId}`, { headers: { Accept: "application/json" } });
      if (!r.ok) return null;
      const j = (await r.json()) as ServerEnrich;
      return j && j.tvmazeId === tvmazeId ? j : null;
    } catch {
      return null;
    }
  })();
  enrichCache.set(tvmazeId, p);
  return p;
}
