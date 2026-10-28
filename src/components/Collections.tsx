import { collections } from "@/data";

export default function Collections() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>KDramaWorld favourites</div>
          <h2 className="section-title text-2xl md:text-3xl">Hand-built collections, argued over at length</h2>
          <p className="mt-2 max-w-xl text-sm" style={{color:"var(--text-muted)"}}>
            Editorial categories — not official genres. Every title here is chosen by a person, not an algorithm.
          </p>
        </div>
        <a href="/lists" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold" style={{color:"var(--text-muted)"}}>
          Public collections
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="space-y-6">
        {collections.map((c, idx) => (
          <div key={c.slug} className={`glass-strong rounded-3xl p-5 md:p-7 grid lg:grid-cols-[280px_1fr] gap-6 items-center`}>
            <div className="flex lg:flex-col items-start gap-4 lg:gap-3">
              <div className="font-display text-5xl md:text-6xl font-black gradient-text leading-none">
                {c.number}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest font-semibold" style={{color:"var(--text-dim)"}}>HanScene Favorites</div>
                <h3 className="font-display text-2xl md:text-3xl font-black italic leading-tight mt-1">{c.title}</h3>
                <p className="mt-2 text-sm max-w-md" style={{color:"var(--text-muted)"}}>{c.blurb}</p>
                <a href={`/lists?collection=${c.slug}`} className="mt-4 btn-primary h-10 px-4 rounded-xl inline-flex items-center gap-2 text-sm font-semibold">
                  Open collection
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
                <div className="mt-3 text-[11px] uppercase tracking-widest" style={{color:"var(--text-dim)"}}>
                  {c.items.length} dramas
                </div>
              </div>
            </div>
            <div className="scroll-x flex gap-3 overflow-x-auto pb-2 -mx-5 md:-mx-7 px-5 md:px-7 lg:mx-0 lg:px-0 lg:-mr-7 lg:pr-7">
              {c.items.map((d, i) => (
                <a key={d.slug} href={`/drama/${d.slug}`} className="shrink-0 w-36 md:w-44 card-hover">
                  <div className={`rounded-xl overflow-hidden aspect-[2/3] relative ${d.art}`}>
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay"
                         style={{background:"radial-gradient(circle at 30% 20%, rgba(255,255,255,.35), transparent 60%)"}}/>
                    <div className="absolute inset-x-0 bottom-0 p-3"
                         style={{background:"linear-gradient(180deg, transparent, rgba(0,0,0,.85))"}}>
                      <div className="font-display italic text-white text-lg leading-tight">{d.title}</div>
                      <div className="text-white/70 text-[10px] uppercase tracking-widest mt-0.5">{d.year} · {d.genres[0]}</div>
                    </div>
                    {i === 0 && idx === 0 && (
                      <div className="absolute top-2 left-2 pill rounded-full px-2 py-0.5 text-[10px] text-white/90 uppercase tracking-widest">Editors' pick</div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
