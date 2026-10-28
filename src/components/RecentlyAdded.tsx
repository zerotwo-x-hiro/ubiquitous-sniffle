import { useLiveData } from "@/LiveData";
import DramaCard from "./DramaCard";
import { Link } from "react-router-dom";

export default function RecentlyAdded() {
  const { recentlyAdded, liveCount } = useLiveData();
  return (
    <section className="relative z-10 px-[4%] py-8 md:py-10">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>
            Live data · {liveCount} titles enriched
          </div>
          <h2 className="section-title text-[22px] md:text-[28px] flex items-center gap-3" style={{ color: "var(--text)" }}>
            Fresh on Air
            <span aria-hidden className="hidden sm:inline-block h-[3px] w-12 rounded-full"
                  style={{ background: "var(--accent)", marginTop: 4 }} />
          </h2>
        </div>
        <Link to="/explore?sort=newest" className="hidden sm:inline-flex items-center gap-1 text-[13px] md:text-[14px] font-semibold"
              style={{ color: "var(--accent)" }}>
          View All
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {recentlyAdded.map((d) => (
          <DramaCard key={d.slug} drama={d} />
        ))}
      </div>
    </section>
  );
}
