import { Link } from "react-router-dom";
import { topRated } from "@/data";
import Poster from "./Poster";

export default function TopRated() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-start">
        <div className="glass-strong rounded-3xl p-6 md:p-8 lg:sticky lg:top-24">
          <span className="kicker">The canon</span>
          <h2 className="section-title mt-4 text-3xl md:text-4xl leading-tight">
            Top Rated <span className="gradient-text italic">K-Dramas</span>
          </h2>
          <p className="mt-3 text-sm md:text-base" style={{ color:"var(--text-muted)" }}>
            The highest audience scores among the entries KDramaWorld has verified by hand — cast, artwork and air dates all on record.
          </p>
          <Link to="/discover?sort=rating" className="btn-primary mt-5 h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
            View all
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
          <div className="mt-6 text-[11px] uppercase tracking-widest" style={{ color:"var(--text-dim)" }}>
            Scores from TMDB audience ratings · verified entries only
          </div>
        </div>

        <ol className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {topRated.slice(0,12).map((d, i) => (
            <li key={d.slug}>
              <Link to={`/drama/${d.slug}`} className="group card-hover block glass rounded-2xl p-3 flex gap-3">
                <div className="relative shrink-0 w-24">
                  <Poster drama={{...d, title:""}} size="sm" showTitle={false} className="!h-32" />
                  <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full grid place-items-center font-display font-black text-lg text-white z-10"
                       style={{ background: "linear-gradient(135deg,#ff5ea8,#9b5cff)", boxShadow:"var(--shadow-glow)" }}>
                    {String(i+1).padStart(2,"0")}
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-semibold text-[15px] leading-tight line-clamp-2 group-hover:text-white" style={{ color:"var(--text)" }}>{d.title}</h3>
                  <div className="text-[11px] mt-1 uppercase tracking-widest" style={{ color:"var(--text-dim)" }}>{d.year}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.genres.slice(0,2).map(g=>(
                      <span key={g} className="pill rounded-full px-1.5 py-0.5 text-[10px]" style={{color:"var(--text-muted)"}}>{g}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-amber-400">★</span>
                    <span className="font-bold text-sm gradient-text">{d.rating.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
