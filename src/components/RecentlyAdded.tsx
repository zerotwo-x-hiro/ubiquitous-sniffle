import { useLiveData } from "@/LiveData";
import Poster from "./Poster";

export default function RecentlyAdded() {
  const { recentlyAdded, liveCount } = useLiveData();
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>
            Live data · {liveCount} enriched so far
          </div>
          <h2 className="section-title text-2xl md:text-3xl">Fresh in the archive</h2>
          <p className="mt-2 max-w-xl text-sm" style={{color:"var(--text-muted)"}}>
            Posters, ratings, and metadata fetched live from the TVMaze API every time you load the page.
          </p>
        </div>
        <a href="/discover?sort=added" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold" style={{color:"var(--text-muted)"}}>
          Browse all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {recentlyAdded.map((d) => (
          <a key={d.slug} href={`/drama/${d.slug}`} className="card-hover group block">
            <div className="aspect-[2/3] rounded-xl overflow-hidden relative">
              <Poster drama={d} showTitle={false} className="!h-full !rounded-none" />
            </div>
            <div className="mt-2 px-0.5">
              <div className="text-[13px] font-semibold leading-tight line-clamp-2 group-hover:text-white" style={{color:"var(--text)"}}>{d.title}</div>
              <div className="text-[11px] uppercase tracking-widest mt-0.5" style={{color:"var(--text-dim)"}}>
                {d.network && <>{d.network} · </>}{d.year}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
