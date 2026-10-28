import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Drama } from "@/data";
import { shelves as seedShelves, featured as seedFeatured, topRated as seedTopRated,
         romance as seedRomance, thrillers as seedThrillers, fantasy as seedFantasy,
         discover as seedDiscover, collections as seedCollections,
         comingSoon as seedComingSoon, recentlyAdded as seedRecentStatic, actors as seedActors } from "@/data";
import type { EnrichedDrama } from "@/api";
import { fetchDramaByTitle, fetchRecentKdramas, pickArtByTitle } from "@/api";

type DataState = {
  /** Featured hero drama, progressively replaced with live data. */
  featured: Drama | EnrichedDrama;
  /** Curated shelves, items progressively enriched. */
  shelves: Array<{ id: string; title: string; eyebrow?: string; items: Array<Drama | EnrichedDrama> }>;
  topRated: Array<Drama | EnrichedDrama>;
  collections: typeof seedCollections;
  comingSoon: Array<Drama | EnrichedDrama>;
  recentlyAdded: Array<Drama | EnrichedDrama>;
  actors: typeof seedActors;
  /** Number of live dramas successfully loaded so far. */
  liveCount: number;
  loading: boolean;
};

const Ctx = createContext<DataState | null>(null);

/** Merge a seed drama list with an enrichment map keyed by slug. */
function merge<T extends Drama>(seeds: T[], map: Map<string, EnrichedDrama>): Array<Drama | EnrichedDrama> {
  return seeds.map((s) => map.get(s.slug) ?? s);
}

async function enrichAll(seeds: Drama[], onProgress: (map: Map<string, EnrichedDrama>) => void) {
  const map = new Map<string, EnrichedDrama>();
  // Small batches to be polite to TVMaze
  const BATCH = 4;
  for (let i = 0; i < seeds.length; i += BATCH) {
    const batch = seeds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((d) => fetchDramaByTitle(d).catch(() => d as EnrichedDrama)));
    for (const r of results) {
      if (r && (r as EnrichedDrama).tvmazeId) map.set(r.slug, r as EnrichedDrama);
    }
    onProgress(new Map(map));
  }
  return map;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, EnrichedDrama>>(() => new Map());
  const [recent, setRecent] = useState<Array<Drama | EnrichedDrama>>(seedRecentStatic);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Collect every seed drama referenced across the homepage
    const allSeeds: Drama[] = [seedFeatured, ...seedDiscover, ...seedRomance,
      ...seedThrillers, ...seedFantasy, ...seedComingSoon, ...seedRecentStatic];
    for (const c of seedCollections) allSeeds.push(...c.items);
    // de-dupe by slug
    const deduped = Array.from(new Map(allSeeds.map((d) => [d.slug, d])).values());

    enrichAll(deduped, (partial) => {
      if (cancelled) return;
      setMap(partial);
      setLiveCount(partial.size);
    }).then((finalMap) => {
      if (cancelled) return;
      setMap(finalMap);
      setLiveCount(finalMap.size);
    });

    // Live "Recently Released" shelf from TVMaze
    fetchRecentKdramas(12).then((items) => {
      if (cancelled || !items.length) return;
      // assign proper slugs
      const fixed = items.map((d) => ({ ...d, slug: slugify(d.title) + "-" + d.tvmazeId, art: d.art || pickArtByTitle(d.title) }));
      setRecent(fixed);
    }).catch(() => {});

    // Mark "done" even if some are pending — the UX is progressive
    const t = setTimeout(() => { if (!cancelled) setLoading(false); }, 4000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const state = useMemo<DataState>(() => {
    const enrichedFeatured = map.get(seedFeatured.slug) ?? seedFeatured;
    const enrichedDiscover = merge(seedDiscover, map);
    const enrichedRomance  = merge(seedRomance, map);
    const enrichedThrillers = merge(seedThrillers, map);
    const enrichedFantasy = merge(seedFantasy, map);
    const enrichedComingSoon = merge(seedComingSoon, map);

    return {
      featured: enrichedFeatured,
      shelves: [
        { id: "discover", title: "Discover Your Next Favorite", eyebrow: "Curated · LIVE", items: enrichedDiscover },
        { id: "recent",   title: "Recently Released",          eyebrow: "Live from TVMaze", items: recent },
        { id: "romance",  title: "A Little Romance",           eyebrow: "Romance · LIVE", items: enrichedRomance },
        { id: "thriller", title: "One More Episode",           eyebrow: "Thriller · LIVE", items: enrichedThrillers },
        { id: "fantasy",  title: "Beyond the Ordinary",        eyebrow: "Sci-Fi & Fantasy · LIVE", items: enrichedFantasy },
      ],
      topRated: merge(seedTopRated, map).slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12),
      collections: seedCollections.map((c) => ({
        ...c,
        items: merge(c.items, map),
      })),
      comingSoon: enrichedComingSoon,
      recentlyAdded: merge(seedRecentStatic, map),
      actors: seedActors,
      liveCount,
      loading,
    };
  }, [map, recent, liveCount, loading]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useLiveData(): DataState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLiveData must be used inside <LiveDataProvider>");
  return ctx;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
