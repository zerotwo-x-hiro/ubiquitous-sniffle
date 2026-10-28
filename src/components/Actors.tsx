import { actors } from "@/data";
import ActorAvatar from "./ActorAvatar";
import { Link } from "react-router-dom";

export default function Actors() {
  return (
    <section className="relative z-10 px-[4%] py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>Cast</div>
          <h2 className="section-title text-[22px] md:text-[28px] flex items-center gap-3" style={{ color: "var(--text)" }}>
            Fan-favorite actors
            <span aria-hidden className="hidden sm:inline-block h-[3px] w-12 rounded-full"
                  style={{ background: "var(--accent)", marginTop: 4 }} />
          </h2>
        </div>
        <Link to="/actors" className="hidden sm:inline-flex items-center gap-1 text-[13px] md:text-[14px] font-semibold"
              style={{ color: "var(--accent)" }}>
          View All
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div className="scroll-x flex gap-5 overflow-x-auto pb-4">
        {actors.map((a) => (
          <Link key={a.slug} to={`/actors/${a.slug}`} className="card-hover shrink-0 w-[130px] md:w-[150px] text-center group">
            <ActorAvatar name={a.name} tmdbProfile={a.tmdbProfile} size={130} ring />
            <div className="mt-3">
              <div className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-accent transition-colors"
                   style={{ color: "var(--text)" }}>{a.name}</div>
              <div className="text-[11px] mt-0.5" style={{color:"var(--text-dim)"}}>Actor</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
