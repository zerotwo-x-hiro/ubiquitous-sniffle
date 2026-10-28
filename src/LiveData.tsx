import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Drama, Collection } from "@/data";
import { shelves as seedShelves, featured as seedFeatured, collections as seedCollections,
         genres as genreDefs, collectionItems, comingSoon as seedComingSoon,
         recentFallback } from "@/data";
import type { EnrichedDrama } from "@/api";
import { fetchDramaByTitle, fetchRecentKdramas, pickArtByTitle, slugifyTitle } from "@/api";
import { deriveStatus, canDisplayRating } from "@/lib/status";

type AnyDrama = Drama | EnrichedDrama;

type DataState = {
  featured: AnyDrama;
  shelves: Array<{ id: string; title: string; eyebrow?: string; items: AnyDrama[] }>;
  topRated: AnyDrama[];
  collections: Array<Collection & { resolvedItems: AnyDrama[]; avgRating: number | null }>;
  comingSoon: AnyDrama[];
  recentlyAdded: AnyDrama[];
  actors: AnyDrama[];
  genreCounts: Record<string, number>;
  liveCount: number;
  loading: boolean;
  /** Given a Collection, return its resolved Drama[] (live-enriched if available). */
  collectionResolve: (c: Collection) => AnyDrama[];
  /** Look up a drama by slug (for DramaPage, deep links). */
  findBySlug: (slug: string) => AnyDrama;
};

const Ctx = createContext<DataState | null>(null);

function merge<T extends Drama>(seeds: T[], map: Map<string, EnrichedDrama>): AnyDrama[] {
  return seeds.map((s) => map.get(s.slug) ?? s);
}

// All canonical seeds we want to live-enrich.
function collectCanonical(): Drama[] {
  const all: Drama[] = [seedFeatured];
  for (const s of seedShelves) all.push(...s.items.filter((x) => !all.find((y) => y.slug === x.slug)));
  for (const c of seedCollections) {
    const items = collectionItems(c);
    for (const it of items) if (!all.find((y) => y.slug === it.slug)) all.push(it);
  }
  for (const cs of seedComingSoon) if (!all.find((y) => y.slug === cs.slug)) all.push(cs);
  for (const rf of recentFallback) if (!all.find((y) => y.slug === rf.slug)) all.push(rf);
  return all;
}

async function enrichAll(seeds: Drama[], onProgress: (map: Map<string, EnrichedDrama>) => void) {
  const map = new Map<string, EnrichedDrama>();
  const BATCH = 4;
  for (let i = 0; i < seeds.length; i += BATCH) {
    const batch = seeds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((d) => fetchDramaByTitle(d).catch(() => null)));
    for (const r of results) {
      if (r && r.tvmazeId) {
        // Strip fabricated rating for upcoming shows (D-003).
        const status = deriveStatus({ status: r.status, premiered: undefined, ended: undefined });
        if (!canDisplayRating(status, r.rating)) r.rating = 0;
        map.set(r.slug, r);
      }
    }
    onProgress(new Map(map));
  }
  return map;
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, EnrichedDrama>>(() => new Map());
  const [recent, setRecent] = useState<AnyDrama[]>(seedShelves.find((s) => s.id === "recent")!.items);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

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

    // Live "Recently Released / Airing" from TVMaze KR schedule
    fetchRecentKdramas(12)
      .then((items) => {
        if (cancelled || !items.length) return;
        const fixed = items.map((d) => {
          const status = deriveStatus({ status: d.status, premiered: String(d.year) ? `${d.year}-01-01` : undefined });
          return { ...d,
            slug: `${slugifyTitle(d.title)}-${d.tvmazeId}`,
            art: d.art || pickArtByTitle(d.title),
            rating: canDisplayRating(status, d.rating) ? d.rating : 0,
          };
        });
        setRecent(fixed);
      })
      .catch(() => {});

    const t = setTimeout(() => { if (!cancelled) setLoading(false); }, 6000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const state = useMemo<DataState>(() => {
    const enrich = (s: Drama) => map.get(s.slug) ?? s;
    const enrichedFeatured = enrich(seedFeatured);
    const shelfDiscover = seedShelves.find((s) => s.id === "discover")!.items.map(enrich);
    const shelfRecent = recent;
    const shelfRomance = seedShelves.find((s) => s.id === "romance")!.items.map(enrich);
    const shelfThriller = seedShelves.find((s) => s.id === "thriller")!.items.map(enrich);
    const shelfFantasy = seedShelves.find((s) => s.id === "fantasy")!.items.map(enrich);

    const shelves = [
      { id: "discover", title: "Discover Your Next Favorite", eyebrow: "Curated",     items: shelfDiscover },
      { id: "recent",   title: "Recently Aired",            eyebrow: "Live · TVMaze", items: shelfRecent },
      { id: "romance",  title: "A Little Romance",          eyebrow: "Romance",       items: shelfRomance },
      { id: "thriller", title: "One More Episode",          eyebrow: "Thriller",      items: shelfThriller },
      { id: "fantasy",  title: "Beyond the Ordinary",       eyebrow: "Sci-Fi & Fantasy", items: shelfFantasy },
    ];

    const collectionResolve = (c: Collection): AnyDrama[] => collectionItems(c).map(enrich);

    const enrichedComingSoon = seedComingSoon.map(enrich);

    const allRated = [...shelfDiscover, ...shelfRomance, ...shelfThriller, ...shelfFantasy];
    const topRated = [...allRated]
      .filter((d) => d.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);

    // Compute genre counts across all live-enriched shelves.
    const counts: Record<string, number> = {};
    for (const def of genreDefs) counts[def.slug] = 0;
    const genreSlugMap: Record<string, string> = {
      "romance":"romance","comedy":"comedy","mystery":"mystery","crime":"crime",
      "drama":"drama","thriller":"thriller","family":"family",
    };
    for (const d of allRated.concat(shelfRecent, enrichedComingSoon)) {
      for (const g of d.genres) {
        const key = Object.keys(genreSlugMap).find(
          (k) => g.toLowerCase().includes(k) || k.includes(g.toLowerCase())
        );
        if (key) counts[genreSlugMap[key]] = (counts[genreSlugMap[key]] || 0) + 1;
        if (/fantasy|sci/i.test(g)) counts["sci-fi-and-fantasy"] = (counts["sci-fi-and-fantasy"] || 0) + 1;
      }
    }

    const allShows = [enrichedFeatured, ...shelfDiscover, ...shelfRecent, ...shelfRomance,
                     ...shelfThriller, ...shelfFantasy, ...enrichedComingSoon];
    const bySlug = new Map<string, AnyDrama>();
    for (const s of allShows) bySlug.set(s.slug, s);
    const findBySlug = (slug: string): AnyDrama => bySlug.get(slug) ?? enrichedFeatured;

    const resolvedCollections = seedCollections.map((c) => {
      const items = collectionResolve(c);
      const rated = items.filter((d) => d.rating > 0);
      const avg = rated.length ? rated.reduce((s, d) => s + d.rating, 0) / rated.length : null;
      return { ...c, resolvedItems: items, avgRating: avg };
    });

    return {
      featured: enrichedFeatured,
      shelves,
      topRated,
      collections: resolvedCollections,
      comingSoon: enrichedComingSoon,
      recentlyAdded: shelfDiscover.slice(0, 6),
      actors: [],
      genreCounts: counts,
      liveCount,
      loading,
      collectionResolve,
      findBySlug,
    };
  }, [map, recent, liveCount, loading]);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useLiveData(): DataState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLiveData outside provider");
  return c;
}
