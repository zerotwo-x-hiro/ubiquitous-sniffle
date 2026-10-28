import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";

export default function AboutPage() {
  useSeo({
    title: "About",
    description: "KDramaWorld is a small, opinionated, ad-free archive of Korean dramas — hand-verified, no fabricated data, no tracking.",
  });
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-3xl mx-auto">
        <span className="kicker"><span className="dot" />About</span>
        <h1 className="section-title mt-3 text-4xl md:text-6xl font-serif">
          A love letter to the <em className="gradient-text not-italic">small screen</em>, in a minor key.
        </h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>
            KDramaWorld is a small, opinionated archive of Korean dramas we kept thinking about long after the
            finale ended. It's not a database of every K-drama ever made. It's a curated shelf: the shows we'd
            press into a friend's hands at a dinner party, with reasons.
          </p>
          <p>
            Ratings come from real audiences. Posters come from the show's official listings. Summaries are
            spoilers-only-to-the-back-of-the-box. We do not invent numbers, names, episode counts, or streaming
            windows, and we label every rating by its source.
          </p>
          <p>
            The site is a side project — fast, private, ad-free, and built by one person in their evenings. If
            something is wrong, please say so and we'll fix it.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="text-3xl mb-2">📺</div>
            <h3 className="font-semibold">Hand-verified catalogue</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Every title on the shelf was watched, argued about, or at least reviewed by a human before it was added.
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold">Honest ratings</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Audience scores come from TVMaze. We label the source and never average across sites.
            </p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-3xl mb-2">🕯️</div>
            <h3 className="font-semibold">No ads, no tracking</h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Any lists or notes you save live in your browser. We do not fingerprint you or sell data.
            </p>
          </div>
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <Link to="/explore" className="btn-primary h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
            Start browsing
          </Link>
          <Link to="/sources" className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
            Data sources
          </Link>
        </div>
      </div>
    </section>
  );
}
