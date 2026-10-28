import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";

const SOURCES = [
  {
    name: "TVMaze",
    url: "https://www.tvmaze.com/api",
    used: "Primary catalogue source. Live metadata (titles, posters, summaries, episode counts, runtime, network, audience rating, status, cast IDs).",
    terms: "Free public API, no key required, CORS-enabled. Attribution required when displaying data. We link back to TVMaze where applicable.",
  },
  {
    name: "TMDB",
    url: "https://www.themoviedb.org/documentation/api",
    used: "Optional server-side enrichment only when a TMDB_ACCESS_TOKEN is configured. Not used in the browser today.",
    terms: "Requires API key. Subject to TMDB terms of use; attribution required.",
  },
  {
    name: "OMDb",
    url: "https://www.omdbapi.com/",
    used: "Optional server-side IMDb rating enrichment. Never called from the browser; cached weekly; halts at daily quota.",
    terms: "Requires API key. Free tier has a 1,000/day limit; paid tiers available.",
  },
  {
    name: "MyDramaList",
    url: "https://mydramalist.com/",
    used: "Link-only. When a drama page offers a 'Search on MyDramaList' button, it opens a search URL in a new tab. We do not fetch, scrape, proxy, or hotlink MDL content or logos.",
    terms: "External site; users are subject to MDL's terms when they click through.",
  },
];

export default function SourcesPage() {
  useSeo({
    title: "Data sources",
    description: "Where KDramaWorld gets its data — TVMaze primary, TMDB/OMDb server-side only, MyDramaList link-only. Ratings are always labelled by source.",
  });
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-3xl mx-auto">
        <span className="kicker"><span className="dot" />Data & attribution</span>
        <h1 className="section-title mt-3 text-4xl md:text-6xl font-serif">Sources</h1>
        <p className="mt-3 text-lg max-w-2xl" style={{ color: "var(--text-muted)" }}>
          KDramaWorld does not fabricate data. Every rating, network, year, episode count, poster and
          synopsis that isn't in our hand-written seed is pulled from a source we name below. We do not
          scrape sites that disallow it.
        </p>

        <div className="mt-10 space-y-5">
          {SOURCES.map((s) => (
            <article key={s.name} className="glass rounded-2xl p-6">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="font-serif text-2xl font-bold">{s.name}</h2>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                   className="text-sm gradient-text font-semibold hover:underline">
                  {s.url.replace(/^https?:\/\//, "")} ↗
                </a>
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--text)" }}>{s.used}</p>
              <p className="mt-2 text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {s.terms}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 glass-strong rounded-2xl p-6">
          <h3 className="font-serif text-xl font-bold mb-2">Rating policy</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <li>Ratings are always labelled by source (e.g. "TVMaze 8.6", "IMDb 8.4 · 120k votes").</li>
            <li>We never average ratings across sources.</li>
            <li>The "Top Rated" shelf requires ≥5,000 IMDb votes before ranking by IMDb rating; otherwise we fall back to TVMaze.</li>
            <li>Upcoming dramas show no numeric rating at all.</li>
          </ul>
        </div>

        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
          If you're a rights-holder and want a poster/summary removed or credited differently, open an issue or
          email the maintainer.
        </p>

        <div className="mt-8">
          <Link to="/" className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
