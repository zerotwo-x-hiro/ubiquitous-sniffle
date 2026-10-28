import { recentlyAdded } from "@/data";

export default function RecentlyAdded() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>Recently added</div>
          <h2 className="section-title text-2xl md:text-3xl">New in the archive</h2>
          <p className="mt-2 max-w-xl text-sm" style={{color:"var(--text-muted)"}}>
            Freshly synchronised titles from the metadata source, newest first.
          </p>
        </div>
        <a href="/discover?sort=added" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold" style={{color:"var(--text-muted)"}}>
          Browse all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {recentlyAdded.map((d) => (
          <a key={d.slug} href={`/drama/${d.slug}`} className="card-hover group">
            <div className={`aspect-[2/3] rounded-xl ${d.art} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-35 mix-blend-overlay"
                   style={{background:"radial-gradient(circle at 30% 20%, rgba(255,255,255,.4), transparent 60%)"}}/>
              <div className="absolute inset-x-0 bottom-0 p-2.5"
                   style={{background:"linear-gradient(180deg, transparent, rgba(0,0,0,.85))"}}>
                <div className="text-white font-semibold text-sm leading-tight line-clamp-2">{d.title}</div>
                <div className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">{d.year}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
