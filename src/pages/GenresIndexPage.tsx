import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveData } from "@/LiveData";
import { genres as genreDefs } from "@/data";
import { useSeo } from "@/lib/seo";
// DramaCard kept out to keep tiles compact / avoid heavy posters

export default function GenresIndexPage() {
  useSeo({
    title: "Genres & moods",
    description: "Browse K-dramas by genre — romance, thriller, fantasy, slice-of-life, and more — with live counts from the archive.",
  });
  const { shelves, genreCounts } = useLiveData();
  const all = useMemo(() => {
    const m = new Map();
    for (const s of shelves) if (!s.live) for (const d of s.items) if (!m.has(d.slug)) m.set(d.slug, d);
    return [...m.values()];
  }, [shelves]);

  function sampleFor(slug: string, n = 4) {
    const test = (g: string) => {
      const gl = g.toLowerCase();
      if (slug === "sci-fi-and-fantasy") return /fantasy|sci/i.test(gl);
      return gl.includes(slug.replace(/-and-fantasy$/, "").toLowerCase());
    };
    return all.filter((d: any) => d.genres.some(test)).slice(0, n);
  }

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <span className="kicker"><span className="dot" />Browse by mood</span>
        <h1 className="section-title mt-3 text-4xl md:text-5xl">Genres & moods</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Every collection on the site, live-counted. Counts update as newly-aired dramas land on the homepage.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {genreDefs.map((g) => {
            const count = genreCounts[g.slug] || 0;
            const samples = sampleFor(g.slug);
            return (
              <Link key={g.slug} to={`/genres/${g.slug}`}
                    className="group glass rounded-2xl p-5 block card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{g.accent}</span>
                  <div>
                    <h3 className="font-serif text-2xl font-bold">{g.name}</h3>
                    <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {count} {count === 1 ? "title" : "titles"}
                    </p>
                  </div>
                  <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 transition" aria-hidden>→</span>
                </div>
                {samples.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {samples.map((d: any) => (
                      <div key={d.slug} className="aspect-[2/3] rounded-lg overflow-hidden relative"
                           style={{ background: `linear-gradient(135deg, var(--art-1), var(--art-3))` }}>
                        <div className="absolute inset-0 flex items-end p-2">
                          <span className="text-[10px] font-semibold leading-tight line-clamp-2">{d.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}


