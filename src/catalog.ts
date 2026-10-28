// src/catalog.ts
//
// Lazy loader for the full TVMaze-generated catalogue at
// src/generated/tvmaze-catalog.json. The JSON is produced by
// scripts/fetch-tvmaze-catalog.mjs (or /api/admin/build-catalog via Vercel)
// and bundled by Vite as a separate async chunk — so first-paint on the
// home page stays fast even when the catalogue contains 2k+ entries.
//
// Compact field names in the JSON match api/admin/build-catalog.js:
//   id tvmazeId, n name, s slug, y year, r rating, rt runtime, g genres,
//   st status, nw network, p mediumPoster, po originalPoster, pr premiered,
//   ed ended, w weight, su summary, im imdb, u tvmazeUrl, up updated.

import { CATALOG as curated } from "@/data";

export type CatalogShow = {
  id: number;
  n: string;
  s: string;
  y: number | null;
  r: number | null;
  rt: number | null;
  g: string[];
  st: string | null;
  nw: string | null;
  p: string | null;
  po: string | null;
  pr: string | null;
  ed: string | null;
  w: number;
  su: string;
  im: string | null;
  u: string;
};

export type FullCatalog = {
  _meta: {
    source: string;
    fetchedAt?: string;
    count: number;
    note?: string;
  };
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

// Convert compact CatalogShow to the Drama shape expected by DramaCard etc.
export function toDrama(s: CatalogShow) {
  return {
    slug: s.s,
    title: s.n,
    year: s.y || 0,
    rating: s.r ?? 0,
    episodes: undefined,
    genres: s.g,
    blurb: s.su,
    art: "art-a",
    network: s.nw || undefined,
    tvmazeId: s.id,
    poster: s.p || undefined,
    posterOriginal: s.po || undefined,
    runtime: s.rt || undefined,
    status: s.st || undefined,
    premiered: s.pr || undefined,
    ended: s.ed || undefined,
    imdbId: s.im || undefined,
    tvmazeUrl: s.u,
    _fromCatalog: true as const,
  };
}

// Merge the curated seed with the full TVMaze catalogue: curated entries
// take precedence (better blurbs), any TVMaze title not already in curated
// (slug match) is appended. Useful for explore/search/genre pages.
export async function mergedCatalog() {
  const full = await loadFullCatalog();
  const seen = new Set<string>();
  const out: (typeof curated[number] | ReturnType<typeof toDrama>)[] = [];
  for (const d of curated) {
    out.push(d);
    seen.add(d.slug);
  }
  for (const s of full.shows) {
    if (seen.has(s.s)) continue;
    seen.add(s.s);
    out.push(toDrama(s));
  }
  return out;
}
