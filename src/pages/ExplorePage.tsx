import { useMemo, useState, useEffect } from "react";
import { useLiveData } from "@/LiveData";
import DramaCard from "@/components/DramaCard";
import { useSeo } from "@/lib/seo";
import type { AnyDrama } from "@/LiveData";
import { loadFullCatalog, toDrama } from "@/catalog";

type Sort = "top-rated" | "newest" | "oldest" | "title" | "popular";
const PAGE_SIZE = 48;

export default function ExplorePage() {
  const { shelves, recentlyAdded, liveCount } = useLiveData();
  useSeo({
    title: "Explore",
    description: "Browse the full KDramaWorld archive — filter by genre, sort by rating or year, search titles and networks.",
  });
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [page, setPage] = useState(1);
  const [extra, setExtra] = useState<AnyDrama[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraSource, setExtraSource] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setExtraLoading(true);
    loadFullCatalog().then((cat) => {
      if (cancelled) return;
      const mapped = cat.shows.map(toDrama) as AnyDrama[];
      setExtra(mapped);
      setExtraSource(cat._meta?.fetchedAt ? `TVMaze (${cat._meta.count} titles, fetched ${new Date(cat._meta.fetchedAt).toLocaleDateString()})` : `TVMaze (${cat._meta.count} titles)`);
      setExtraLoading(false);
    }).catch(() => setExtraLoading(false));
    return () => { cancelled = true; };
  }, []);

  const discoverShelf = shelves.find((s) => s.id === "discover");
  const recentShelf = shelves.find((s) => s.live);

  // Union all curated shelf items + recentlyAdded + loaded catalog entries (deduped by slug).
  const all = useMemo(() => {
    const m = new Map<string, AnyDrama>();
    for (const s of shelves) {
      if (s.live) continue;
      for (const d of s.items) if (!m.has(d.slug)) m.set(d.slug, d);
    }
    for (const d of recentlyAdded) if (!m.has(d.slug)) m.set(d.slug, d);
    for (const d of extra) if (!m.has(d.slug)) m.set(d.slug, d);
    return [...m.values()];
  }, [shelves, recentlyAdded, extra]);

  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const d of all) for (const g of (d.genres as string[])) set.add(g);
    return ["all", ...[...set].sort()];
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all.filter((d) => {
      if (genreFilter !== "all") {
        const gl = d.genres.map((g) => g.toLowerCase()).join(" ");
        if (genreFilter === "sci-fi-and-fantasy") {
          if (!/fantasy|sci/i.test(gl)) return false;
        } else if (!gl.includes(genreFilter.toLowerCase())) return false;
      }
      if (q && !(`${d.title} ${d.network || ""}`).toLowerCase().includes(q)) return false;
      return true;
    });
    switch (sort) {
      case "newest":  list.sort((a, b) => b.year - a.year); break;
      case "oldest":  list.sort((a, b) => a.year - b.year); break;
      case "title":   list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "top-rated":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.year - a.year);
        list = list.filter((d) => d.rating >= 5); // ranked only
        break;
      case "popular":
      default:        list.sort((a, b) => {
        // Curated titles get a boost so editorial picks stay near the top.
        const aBoost = (d: AnyDrama) => (d as any)._fromCatalog ? 0 : 1000;
        return (b.rating || 0) - (a.rating || 0) || b.year - a.year || aBoost(b) - aBoost(a);
      });
    }
    return list;
  }, [all, query, genreFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(0, safePage * PAGE_SIZE);
  useEffect(() => { setPage(1); }, [query, genreFilter, sort]);


  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <span className="kicker"><span className="dot" />The archive</span>
        <h1 className="section-title mt-3 text-4xl md:text-5xl">Explore every drama</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          {all.length} titles{liveCount > 0 ? ` · ${liveCount} enriched live from TVMaze` : ""}
          {extraLoading && extra.length === 0 ? " · loading full TVMaze catalogue…" : extraSource ? ` · ${extraSource}` : ""}.
          Filter by genre, sort, search — and click any title for the deep dive.
        </p>

        <div className="mt-8 glass rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex-1">
            <label className="sr-only" htmlFor="q">Search dramas</label>
            <input
              id="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or network…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-11 text-sm outline-none focus:border-white/30"
              style={{ color: "var(--text)" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-sm outline-none"
                    style={{ color: "var(--text)" }}>
              {genres.map((g) => (
                <option key={g} value={g} style={{ background: "#160b2a" }}>
                  {g === "all" ? "All genres" : g}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                    className="bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-sm outline-none"
                    style={{ color: "var(--text)" }}>
              <option value="popular" style={{ background: "#160b2a" }}>Popular</option>
              <option value="top-rated" style={{ background: "#160b2a" }}>Top rated (≥5★)</option>
              <option value="newest" style={{ background: "#160b2a" }}>Newest</option>
              <option value="oldest" style={{ background: "#160b2a" }}>Oldest</option>
              <option value="title" style={{ background: "#160b2a" }}>Title A–Z</option>
            </select>
          </div>
        </div>

        {recentShelf && recentShelf.items.length > 0 && (
          <div className="mt-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4 gradient-text">Fresh on air</h2>
            <p className="text-sm -mt-3 mb-4" style={{ color: "var(--text-muted)" }}>
              Pulled live from the Korean web-schedule (last 3 weeks / next 2 weeks).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {recentShelf.items.slice(0, 12).map((d) => <DramaCard key={d.slug} drama={d} compact />)}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-end justify-between">
          <h2 className="font-serif text-2xl md:text-3xl font-bold">All dramas</h2>
          <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            showing {Math.min(paged.length, filtered.length)} of {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 glass-strong rounded-2xl p-10 text-center">
            <p style={{ color: "var(--text-muted)" }}>No dramas match that filter yet.</p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {paged.map((d) => <DramaCard key={d.slug} drama={d} />)}
            </div>
            {safePage < totalPages && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setPage(safePage + 1)}
                  className="btn-ghost h-11 px-6 rounded-xl font-semibold text-sm hover:bg-white/10 transition"
                >
                  Load more ({filtered.length - paged.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
