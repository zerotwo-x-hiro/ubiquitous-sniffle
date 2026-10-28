import { comingSoon } from "@/data";

export default function ComingSoon() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>
            2026 release slate
          </div>
          <h2 className="section-title text-2xl md:text-3xl">
            Coming Soon<span className="gradient-text">♡</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm" style={{color:"var(--text-muted)"}}>
            Premiere dates shown when confirmed.
          </p>
        </div>
        <a href="/discover?yearFrom=2026&sort=newest" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold"
           style={{color:"var(--text-muted)"}}>
          View all {""}
          <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{background:"var(--bg-elev-2)", border:"1px solid var(--border-strong)"}}>73</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        {comingSoon.slice(0,8).map((d) => (
          <a key={d.slug} href={`/drama/${d.slug}`}
             className="card-hover glass rounded-2xl p-3 flex gap-4 items-center group">
            <div className={`relative w-24 h-32 shrink-0 rounded-xl overflow-hidden ${d.art}`}>
              <div className="absolute inset-0 opacity-40 mix-blend-overlay"
                   style={{background:"radial-gradient(circle at 20% 20%, rgba(255,255,255,.4), transparent 50%)"}}/>
              <div className="absolute top-1.5 left-1.5 pill rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/85">
                {d.network}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 text-white"
                   style={{background:"linear-gradient(180deg, transparent, rgba(0,0,0,.8))"}}>
                <div className="text-[11px] font-bold">{d.year}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/70">Date to be announced</div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[15px] md:text-base leading-tight group-hover:text-white truncate"
                  style={{color:"var(--text)"}}>{d.title}</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {d.genres.slice(0,2).map(g=>(
                  <span key={g} className="pill rounded-full px-1.5 py-0.5 text-[10px]" style={{color:"var(--text-muted)"}}>{g}</span>
                ))}
              </div>
              <p className="mt-2 text-[13px] line-clamp-2" style={{color:"var(--text-muted)"}}>{d.blurb}</p>
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition"
                   style={{color:"var(--accent-b)"}}>
                Remind me
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
