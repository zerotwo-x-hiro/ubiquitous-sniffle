import { collections } from "@/data";
import DramaCard from "./DramaCard";
import { useLiveData } from "@/LiveData";
import { Link } from "react-router-dom";

export default function Collections() {
  const { collectionResolve } = useLiveData();
  return (
    <section className="relative z-10 px-[4%] py-8 md:py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>Editorial Collections</div>
          <h2 className="section-title text-[22px] md:text-[28px] flex items-center gap-3" style={{ color: "var(--text)" }}>
            Hand-picked for you
            <span aria-hidden className="hidden sm:inline-block h-[3px] w-12 rounded-full"
                  style={{ background: "var(--accent-2)", marginTop: 4 }} />
          </h2>
        </div>
        <Link to="/lists" className="hidden sm:inline-flex items-center gap-1 text-[13px] md:text-[14px] font-semibold"
              style={{ color: "var(--accent)" }}>
          All Collections
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div className="space-y-8">
        {collections.map((c) => {
          const items = collectionResolve(c);
          const rated = items.filter((d: any) => d.rating > 0);
          const avg = rated.length ? rated.reduce((s: number, d: any) => s + d.rating, 0) / rated.length : 0;
          return (
            <div key={c.slug}>
              <div className="flex items-end justify-between mb-3 px-1">
                <div>
                  <h3 className="text-[18px] md:text-[22px] font-bold leading-tight" style={{ color: "var(--text)" }}>
                    {c.title}
                  </h3>
                  <p className="mt-1 text-sm max-w-2xl" style={{color:"var(--text-muted)"}}>{c.blurb}</p>
                </div>
                <div className="text-[11px] uppercase tracking-widest shrink-0 ml-4" style={{color:"var(--text-dim)"}}>
                  {items.length} titles{avg ? ` · ★ ${avg.toFixed(1)}` : ""}
                </div>
              </div>
              <div className="scroll-x flex gap-3 md:gap-4 overflow-x-auto pb-4">
                {items.map((d: any) => (
                  <div key={d.slug} className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] shrink-0">
                    <DramaCard drama={d} showTitle />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
