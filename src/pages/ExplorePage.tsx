import { useMemo, useState } from "react";
import { useLiveData } from "@/LiveData";
import DramaCard from "@/components/DramaCard";
import { useSeo } from "@/lib/seo";
import type { AnyDrama } from "@/LiveData";

type Sort = "top-rated" | "newest" | "oldest" | "title";

export default function ExplorePage() {
  const { shelves, recentlyAdded, findBySlug, liveCount } = useLiveData();
  useSeo({
    title: "Explore",
    description: "Browse the full KDramaWorld archive — filter by genre, sort by rating or year, search titles and networks.",
  });
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("top-rated");

  const discoverShelf = shelves.find((s) => s.id === "discover");
  const recentShelf = shelves.find((s) => s.live);

  // Union all items from non-live shelves (deduped).
  const all = useMemo(() => {
    const m = new Map<string, AnyDrama>();
    for (const s of shelves) {
      if (s.live) continue;
      for (const d of s.items) if (!m.has(d.slug)) m.set(d.slug, d);
    }
    for (const d of recentlyAdded) if (!m.has(d.slug)) m.set(d.slug, d);
    return [...m.values()];
  }, [shelves, recentlyAdded]);

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
      default:        list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.year - a.year);
    }
    return list;
  }, [all, query, genreFilter, sort]);

  const unusedFindBySlug = findBySlug; // keep import alive; future search-by-slug
  void unusedFindBySlug;

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <span className="kicker"><span className="dot" />The archive</span>
        <h1 className="section-title mt-3 text-4xl md:text-5xl">Explore every drama</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          {all.length} hand-verified entries{liveCount > 0 ? `, ${liveCount} enriched live from TVMaze` : ""}.
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
              <option value="top-rated" style={{ background: "#160b2a" }}>Top rated</option>
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
            {filtered.length} titles
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 glass-strong rounded-2xl p-10 text-center">
            <p style={{ color: "var(--text-muted)" }}>No dramas match that filter yet.</p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {filtered.map((d) => <DramaCard key={d.slug} drama={d} />)}
          </div>
        )}
      </div>
    </section>
  );
}
