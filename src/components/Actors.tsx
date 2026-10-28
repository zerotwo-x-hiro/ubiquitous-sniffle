import { actors } from "@/data";

export default function Actors() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>On screen</div>
          <h2 className="section-title text-2xl md:text-3xl">The faces of the archive.</h2>
          <p className="mt-2 max-w-xl text-sm" style={{color:"var(--text-muted)"}}>
            Cast and filmography are loaded from TVMaze. Filmographies only link to dramas in our catalogue.
          </p>
        </div>
        <a href="/actors" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold" style={{color:"var(--text-muted)"}}>
          Browse all actors
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="scroll-x flex gap-4 md:gap-5 -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12 pb-4">
        {actors.map((a) => (
          <a key={a.slug} href={`/actors/${a.slug}`} className="card-hover shrink-0 w-36 md:w-40 group">
            <div className="glass rounded-2xl p-2.5">
              <div className={`relative aspect-[3/4] rounded-xl overflow-hidden ${a.art}`}>
                <div className="absolute inset-0"
                     style={{background:"radial-gradient(circle at 50% 30%, rgba(255,255,255,.35), transparent 60%)"}} />
                <div className="absolute inset-x-0 bottom-0 p-3"
                     style={{background:"linear-gradient(180deg, transparent, rgba(0,0,0,.8))"}}>
                  <div className="text-white font-display italic text-lg leading-none drop-shadow-lg">
                    {a.name.split(" ").slice(0,-1).join(" ")}
                  </div>
                  <div className="text-white font-display italic text-lg leading-none drop-shadow-lg">
                    {a.name.split(" ").slice(-1)[0]}
                  </div>
                </div>
              </div>
              <div className="mt-2 px-1 text-center">
                <div className="font-semibold text-sm truncate">{a.name}</div>
                <div className="text-[11px] mt-0.5" style={{color:"var(--text-muted)"}}>
                  Cast from TVMaze
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
