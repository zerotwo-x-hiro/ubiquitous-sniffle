import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Drama, Collection } from "@/data";
import {
  CATALOG, SHELF_DEFS, featured as seedFeatured, collections as seedCollections,
  genres as genreDefs, SLUG_REDIRECTS, bySlugs, resolveSlug, collectionItems,
} from "@/data";
import type { EnrichedDrama } from "@/api";
import { fetchDramaByTitle, fetchRecentKdramas, pickArtByTitle, slugifyTitle } from "@/api";
import { deriveStatus, canDisplayRating } from "@/lib/status";
import { loadFullCatalog, toDrama } from "@/catalog";

export type AnyDrama = Drama | EnrichedDrama;

type DataState = {
  featured: AnyDrama;
  shelves: Array<{ id: string; title: string; eyebrow?: string; items: AnyDrama[]; live?: boolean }>;
  topRated: AnyDrama[];
  collections: Array<Collection & { resolvedItems: AnyDrama[]; avgRating: number | null }>;
  comingSoon: AnyDrama[];
  recentlyAdded: AnyDrama[];
  genreCounts: Record<string, number>;
  liveCount: number;
  loading: boolean;
  collectionResolve: (c: Collection) => AnyDrama[];
  findBySlug: (slug: string) => AnyDrama | undefined;
};

const Ctx = createContext<DataState | null>(null);

function enrichOne<T extends Drama>(s: T, map: Map<string, EnrichedDrama>): AnyDrama {
  return map.get(s.slug) ?? s;
}

function collectCanonical(): Drama[] {
  return CATALOG.slice();
}

async function enrichAll(seeds: Drama[], onProgress: (map: Map<string, EnrichedDrama>) => void) {
  const map = new Map<string, EnrichedDrama>();
  const BATCH = 4;
  for (let i = 0; i < seeds.length; i += BATCH) {
    const batch = seeds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((d) => fetchDramaByTitle(d).catch(() => null)));
    for (const r of results) {
      if (!r || !r.tvmazeId) continue;
      const st = deriveStatus({ status: r.status, premiered: undefined, ended: undefined });
      if (!canDisplayRating(st, r.rating)) r.rating = 0;
      map.set(r.slug, r);
    }
    onProgress(new Map(map));
  }
  return map;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, EnrichedDrama>>(() => new Map());
  const [recent, setRecent] = useState<AnyDrama[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);
  const [catalogShows, setCatalogShows] = useState<AnyDrama[]>([]);

  useEffect(() => {
    let cancelled = false;
    const seeds = collectCanonical();

    enrichAll(seeds, (partial) => {
      if (cancelled) return;
      setMap(partial);
      setLiveCount(partial.size);
    }).then((finalMap) => {
      if (cancelled) return;
      setMap(finalMap);
      setLiveCount(finalMap.size);
      setLoading(false);
    });

    // Load the generated TVMaze catalogue (2k+ titles) in the background
    // so drama pages for non-curated titles still resolve.
    loadFullCatalog().then((cat) => {
      if (cancelled) return;
      setCatalogShows(cat.shows.map(toDrama));
    }).catch(() => {});

    fetchRecentKdramas(12)
      .then((items) => {
        if (cancelled || !items.length) return;
        const fixed = items.map((d) => {
          const st = deriveStatus({ status: d.status, premiered: d.year ? `${d.year}-01-01` : undefined });
          return {
            ...d,
            slug: `${slugifyTitle(d.title)}-${d.tvmazeId}`,
            art: d.art || pickArtByTitle(d.title),
            rating: canDisplayRating(st, d.rating) ? d.rating : 0,
          };
        });
        setRecent(fixed);
      })
      .catch(() => {});

    const t = setTimeout(() => { if (!cancelled) setLoading(false); }, 6000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const state = useMemo<DataState>(() => {
    const enrich = (s: Drama) => enrichOne(s, map);

    const shelfItems = (slugList: string[]) => bySlugs(slugList).map(enrich);

    const liveShelfItems: AnyDrama[] = recent.length ? recent : shelfItems([
      "when-life-gives-you-tangerines","lovely-runner","marry-my-husband","twenty-five-twenty-one",
    ]).map(d => ({ ...d, isNew: true }));

    const shelves = SHELF_DEFS.map(s => ({
      id: s.id,
      title: s.title,
      eyebrow: s.eyebrow,
      live: !!s.live,
      items: s.live ? liveShelfItems : shelfItems(s.slugList),
    }));

    const collectionResolve = (c: Collection): AnyDrama[] => collectionItems(c).map(enrich);

    const discoverShelf = shelves.find(s => s.id === "discover")!.items;
    const allShelved = [enrich(seedFeatured), ...shelves.flatMap(s => s.items)];

    const topRated = [...new Map(allShelved.map(d => [d.slug, d])).values()]
      .filter((d) => d.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);

    const counts: Record<string, number> = {};
    for (const def of genreDefs) counts[def.slug] = 0;
    const allShows = [...new Map(allShelved.map(d => [d.slug, d])).values()];
    for (const d of allShows) {
      for (const g of d.genres) {
        const gl = g.toLowerCase();
        if (gl.includes("romance")) counts.romance++;
        else if (gl.includes("comedy")) counts.comedy++;
        else if (gl.includes("mystery")) counts.mystery++;
        else if (gl.includes("crime")) counts.crime++;
        else if (gl.includes("family")) counts.family++;
        else if (gl.includes("drama")) counts.drama++;
        else if (gl.includes("thriller")) counts.thriller++;
        else if (gl.includes("historical")) counts.historical = (counts.historical || 0) + 1;
        if (/fantasy|sci/i.test(gl)) counts["sci-fi-and-fantasy"]++;
      }
    }

    const bySlug = new Map<string, AnyDrama>();
    for (const s of allShows) bySlug.set(s.slug, s);
    // Merge TVMaze catalog entries (curated + shelves take precedence).
    for (const s of catalogShows) { if (!bySlug.has(s.slug)) bySlug.set(s.slug, s); }

    const findBySlug = (slug: string): AnyDrama | undefined => {
      const key = Object.prototype.hasOwnProperty.call(SLUG_REDIRECTS, slug)
        ? SLUG_REDIRECTS[slug]
        : slug;
      if (!key) return undefined;
      return bySlug.get(key) ?? (() => {
        const seed = resolveSlug(key);
        if (seed) return enrich(seed);
        return catalogShows.find((c) => c.slug === key);
      })();
    };

    const resolvedCollections = seedCollections.map((c) => {
      const items = collectionResolve(c);
      const rated = items.filter((d) => d.rating > 0);
      const avg = rated.length
        ? Math.round((rated.reduce((s, d) => s + d.rating, 0) / rated.length) * 10) / 10
        : null;
      return { ...c, resolvedItems: items, avgRating: avg };
    });

    return {
      featured: enrich(seedFeatured),
      shelves,
      topRated,
      collections: resolvedCollections,
      comingSoon: [],
      recentlyAdded: discoverShelf.slice(0, 6),
      genreCounts: counts,
      liveCount,
      loading,
      collectionResolve,
      findBySlug,
    };
  }, [map, recent, liveCount, loading, catalogShows]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useLiveData(): DataState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLiveData outside provider");
  return c;
}
