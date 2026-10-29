import { useMemo, useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useLiveData } from "@/LiveData";
import { genres as genreDefs } from "@/data";
import DramaCard from "@/components/DramaCard";
import { useSeo } from "@/lib/seo";

export default function GenrePage() {
  const { slug } = useParams<{ slug: string }>();
  const { shelves, catalogShows, catalogLoading } = useLiveData();
  const [page, setPage] = useState(1);
  const pageSize = 48;
  useEffect(() => setPage(1), [slug]);
  const def = genreDefs.find((g) => g.slug === slug);

  const items = useMemo(() => {
    if (!def) return [];
    const m = new Map<string, any>();
    for (const s of shelves) {
      if (s.live) continue;
      for (const d of s.items) if (!m.has(d.slug)) m.set(d.slug, d);
    }
    for (const d of catalogShows) if (!m.has(d.slug)) m.set(d.slug, d);

    const matches = (genres: string[]) => {
      const gl = genres.map((x) => x.toLowerCase()).join(" ");
      if (def.slug === "sci-fi-and-fantasy") return /fantasy|sci/i.test(gl);
      if (def.slug === "historical") return /historical|history/i.test(gl);
      return gl.includes(def.slug.toLowerCase());
    };
    return [...m.values()]
      .filter((d: any) => matches(d.genres))
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0) || b.year - a.year);
  }, [def, shelves, catalogShows]);

  useSeo({
    title: def ? `${def.name} dramas` : "Genre",
    description: def
      ? `The best K-dramas in the ${def.name} genre — curated, rated, poster-rich, live from TVMaze.`
      : "Genre collection on KDramaWorld.",
  });

  if (!def) return <Navigate to="/genres" replace />;

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <Link to="/genres" className="text-sm hover:underline" style={{ color: "var(--text-muted)" }}>
          ← All genres
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-5xl">{def.accent}</span>
          <div>
            <span className="kicker"><span className="dot" />Genre collection</span>
            <h1 className="section-title mt-1 text-4xl md:text-5xl font-serif">{def.name}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {items.length} {items.length === 1 ? "title" : "titles"} in the TVMaze archive.
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 glass-strong rounded-2xl p-10 text-center">
            <p style={{ color: "var(--text-muted)" }}>{catalogLoading ? "Loading the full TVMaze catalogue…" : "No titles in this genre yet."}</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {items.slice(0, page * pageSize).map((d: any) => <DramaCard key={d.slug} drama={d} />)}
          </div>
        )}
        {page * pageSize < items.length && (
          <div className="mt-8 flex justify-center">
            <button type="button" className="btn-ghost h-11 px-6 rounded-xl font-semibold text-sm" onClick={() => setPage((current) => current + 1)}>
              Load more ({items.length - page * pageSize} remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
