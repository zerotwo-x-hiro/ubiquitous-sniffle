// Full TVMaze catalogue generated before Vite bundles the app.
import { CATALOG as curated } from "@/data";

export type CatalogShow = {
  id: number; name: string; slug: string; year: number | null; rating: number | null;
  runtime: number | null; episodes: number | null; genres: string[]; status: string | null;
  network: string | null; country: string | null; poster: string | null; posterOriginal: string | null;
  premiered: string | null; ended: string | null; weight: number; summary: string; updated: number;
  imdb: string | null; tvdb: string | null; url: string;
};
export type FullCatalog = {
  _meta: { source: string; fetchedAt?: string; count: number; note?: string; lastPage?: number; filter?: string };
  shows: CatalogShow[];
};

let promise: Promise<FullCatalog> | null = null;
export function loadFullCatalog(): Promise<FullCatalog> {
  if (promise) return promise;
  promise = import("@/generated/tvmaze-catalog.json")
    .then((m) => m.default as FullCatalog)
    .catch(() => ({ _meta: { source: "empty", count: 0, note: "fetch failed" }, shows: [] }));
  return promise;
}

const ART = ["art-a", "art-b", "art-c", "art-d", "art-e", "art-f", "art-g", "art-h"] as const;
export function toDrama(s: CatalogShow) {
  return {
    slug: s.slug, title: s.name, year: s.year || 0, rating: s.rating ?? 0,
    episodes: s.episodes ?? undefined, genres: s.genres || [], blurb: s.summary || "",
    art: ART[Math.abs(s.id) % ART.length], network: s.network || undefined, tvmazeId: s.id,
    poster: s.poster || undefined, posterOriginal: s.posterOriginal || undefined,
    runtime: s.runtime || undefined, status: s.status || undefined, premiered: s.premiered || undefined,
    ended: s.ended || undefined, imdbId: s.imdb || undefined, tvdbId: s.tvdb || undefined,
    tvmazeUrl: s.url, _fromCatalog: true as const,
  };
}
export async function mergedCatalog() {
  const full = await loadFullCatalog();
  const seen = new Set<string>();
  const out: (typeof curated[number] | ReturnType<typeof toDrama>)[] = [];
  for (const d of curated) { out.push(d); seen.add(d.slug); }
  for (const s of full.shows) { if (seen.has(s.slug)) continue; seen.add(s.slug); out.push(toDrama(s)); }
  return out;
}
