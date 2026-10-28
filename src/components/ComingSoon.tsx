import { useLiveData } from "@/LiveData";
import Poster from "./Poster";
import { deriveStatus, statusLabel } from "@/lib/status";

export default function ComingSoon() {
  const { comingSoon } = useLiveData();
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>
            Upcoming
          </div>
          <h2 className="section-title text-2xl md:text-3xl">
            Coming Soon<span className="gradient-text">♡</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm" style={{color:"var(--text-muted)"}}>
            Titles announced for future release. No ratings shown until the drama actually airs.
          </p>
        </div>
        <a href="/discover?sort=upcoming" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold"
           style={{color:"var(--text-muted)"}}>
          View all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      {comingSoon.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm" style={{color:"var(--text-muted)"}}>
          No upcoming titles loaded yet. The live schedule will refresh shortly.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 md:gap-5">
          {comingSoon.slice(0,8).map((d) => {
            const status = deriveStatus({ status: (d as any).status, premiered: `${d.year}-01-01` });
            return (
              <a key={d.slug} href={`/drama/${d.slug}`}
                 className="card-hover glass rounded-2xl p-3 flex gap-4 items-center group">
                <div className="relative w-24 shrink-0 rounded-xl overflow-hidden">
                  <Poster drama={d} size="sm" showTitle={false} className="!h-32 !rounded-none" />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white pointer-events-none"
                       style={{background:"linear-gradient(180deg, transparent, rgba(0,0,0,.85))"}}>
                    <div className="text-[11px] font-bold">{d.year}</div>
                    <div className="text-[9px] uppercase tracking-widest text-white/80">{statusLabel(status)}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[15px] md:text-base leading-tight group-hover:text-white truncate"
                      style={{color:"var(--text)"}}>{d.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]" style={{color:"var(--text-dim)"}}>
                    {d.network && <span className="uppercase tracking-widest">{d.network}</span>}
                    {d.network && <span className="opacity-50">·</span>}
                    <span>{d.year}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.genres.slice(0,2).map(g=>(
                      <span key={g} className="pill rounded-full px-1.5 py-0.5 text-[10px]" style={{color:"var(--text-muted)"}}>{g}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[13px] line-clamp-2" style={{color:"var(--text-muted)"}}>{d.blurb}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
