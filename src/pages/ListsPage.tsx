import { Link } from "react-router-dom";
import { useLiveData } from "@/LiveData";
import DramaCard from "@/components/DramaCard";
import { useSeo } from "@/lib/seo";

export default function ListsPage() {
  const { collections } = useLiveData();
  useSeo({
    title: "Collections",
    description: "Hand-built, opinionated K-drama lists — all-time greats, second leads, midnight watchlist. Every pick is human-chosen.",
  });

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <span className="kicker"><span className="dot" />Editorial</span>
        <h1 className="section-title mt-3 text-4xl md:text-5xl">Hand-built collections</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Argued over at length. Posters and metadata come live from TVMaze; picks chosen by a human, not a
          metric. Every collection is short, opinionated, and spoilered only as far as the back of the box.
        </p>

        <div className="mt-10 space-y-12">
          {collections.map((c) => (
            <div key={c.slug} className="glass rounded-3xl p-6 md:p-8">
              <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                <div>
                  <span className="kicker"><span className="dot" />{c.number}</span>
                  <h2 className="mt-2 font-serif text-3xl md:text-4xl font-bold">{c.title}</h2>
                  <p className="mt-2 max-w-2xl" style={{ color: "var(--text-muted)" }}>{c.blurb}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold gradient-text">
                    {c.avgRating ? `★ ${c.avgRating.toFixed(1)}` : "—"}
                  </div>
                  <div className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {c.resolvedItems.length} dramas
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {c.resolvedItems.map((d: any) => <DramaCard key={d.slug} drama={d} compact />)}
              </div>
              {c.slug === "the-all-time-greats" && (
                <Link to="/" className="mt-6 btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
                  Back to home
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
