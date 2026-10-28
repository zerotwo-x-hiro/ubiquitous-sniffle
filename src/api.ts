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
  backdrop?: string;     // original image
  imdbId?: string;
  status?: string;
  runtime?: number;
  summaryText?: string;  // HTML stripped for blurb
  fetchError?: string;
};

const BASE = "https://api.tvmaze.com";

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

/** True when a TVMaze show is likely the Korean drama we want. */
function isKoreanDrama(show: TvMazeShow): boolean {
  const cc = show.network?.country?.code ?? show.webChannel?.country?.code;
  if (cc === "KR") return true;
  if ((show.language || "").toLowerCase() === "korean") return true;
  // Reject shows whose network/channel is clearly Japanese anime or non-KR.
  const chan = (show.network?.name || show.webChannel?.name || "").toLowerCase();
  if (/(at-x|tokyo mx|nhk|fuji tv|tbs|mbs|abema|wowow|weverse|vlive)/.test(chan)) return false;
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

  // Prefer direct /shows/:id lookup when we have a known-good TVMaze id —
  // avoids the Goblin → Goblin Slayer (AT-X anime) class of F1 wrong matches.
  const useId = typeof seed.tvmazeId === "number" && seed.tvmazeId > 0;
  const url = useId
    ? `${BASE}/shows/${seed.tvmazeId}${episodes ? "?embed=episodes" : ""}`
    : (() => {
        const params = new URLSearchParams({ q: seed.title });
        if (episodes) params.set("embed", "episodes");
        return `${BASE}/singlesearch/shows?${params.toString()}`;
      })();

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      if (res.status === 404) return { ...seed };
      throw new Error(`TVMaze ${res.status}`);
    }
    const show: TvMazeShow = await res.json();

    // Validate fuzzy title matches (only for /singlesearch, not id lookups)
    if (!useId) {
      if (!isKoreanDrama(show)) return { ...seed };
      if (!yearMatches(show, seed.year)) return { ...seed };
    }

    const year = yearFrom(show.premiered) ?? seed.year;
    const runtime = show.averageRuntime ?? show.runtime;
    const epCount = show._embedded?.episodes?.length;
    const summary = stripHtml(show.summary);

    const merged: EnrichedDrama = {
      ...seed,
      title: show.name || seed.title,
      year,
      rating: pickRating(show),
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
    return merged;
  } catch (e) {
    return { ...seed, fetchError: (e as Error).message };
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
        const isReality = (show.genres || []).some((g: string) => /reality|variety|talk|music|game.show/i.test(g));
        const isKorean =
          (show.network?.country?.code === "KR" ||
           show.webChannel?.country?.code === "KR" ||
           (show.language || "").toLowerCase() === "korean");
        const isDrama = (show.genres || []).some((g: string) => /drama/i.test(g));
        if (isKPopChannel || isReality || !(isKorean && isDrama)) continue;
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
