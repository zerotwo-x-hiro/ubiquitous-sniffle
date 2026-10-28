import { genres } from "@/data";
import { useLiveData } from "@/LiveData";

export default function Genres() {
  const { genreCounts } = useLiveData();
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{ color:"var(--text-dim)" }}>
            Browse by mood
          </div>
          <h2 className="section-title text-2xl md:text-3xl">Genre Collections</h2>
          <p className="mt-2 max-w-xl text-sm" style={{ color:"var(--text-muted)" }}>
            Explore by mood and shelf. Counts are computed live from the catalogue — including newly aired dramas.
          </p>
        </div>
        <a href="/genres" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold"
           style={{ color:"var(--text-muted)" }}>
          All genres
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {genres.map((g) => {
          const count = genreCounts[g.slug];
          return (
            <a key={g.slug} href={`/genres/${g.slug}`}
               className="group card-hover glass rounded-2xl overflow-hidden relative block h-36 md:h-40">
              <div className={`absolute inset-0 ${g.art} opacity-90`} />
              <div className="absolute inset-0"
                   style={{ background: "linear-gradient(180deg, rgba(0,0,0,.1) 20%, rgba(0,0,0,.7) 100%)" }} />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="pill rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/90">
                    {count != null ? `${count.toLocaleString()} titles` : "Loading…"}
                  </span>
                  <span className="w-8 h-8 rounded-full grid place-items-center bg-white/15 backdrop-blur-md border border-white/20 text-white transition group-hover:bg-white/25"
                        aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </span>
                </div>
                <div>
                  <div className="text-white/80 text-[11px] uppercase tracking-widest mb-1" style={{ color: g.accent }}>
                    Collection
                  </div>
                  <h3 className="font-display text-white text-2xl md:text-3xl font-black italic leading-tight drop-shadow-md">
                    {g.name}
                  </h3>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
