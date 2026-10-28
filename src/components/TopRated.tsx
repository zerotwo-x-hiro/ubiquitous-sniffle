import { Link } from "react-router-dom";
import DramaCard from "./DramaCard";
import { useLiveData } from "@/LiveData";

export default function TopRated() {
  const { topRated } = useLiveData();
  if (!topRated.length) return null;
  return (
    <section className="relative z-10 py-6 md:py-8">
      <div className="flex items-end justify-between gap-4 mb-4 px-[4%]">
        <h2 className="section-title text-[22px] md:text-[28px] flex items-center gap-3" style={{ color: "var(--text)" }}>
          Top Rated
          <span aria-hidden className="hidden sm:inline-block h-[3px] w-12 rounded-full"
                style={{ background: "var(--gold)", marginTop: 4 }} />
        </h2>
        <Link to="/explore?sort=top-rated" className="text-[13px] md:text-[14px] font-semibold inline-flex items-center gap-1 shrink-0"
              style={{ color: "var(--accent)" }}>
          View All
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div className="scroll-x flex gap-3 md:gap-4 overflow-x-auto pb-6 pt-2 px-[4%]">
        {topRated.map((d) => (
          <div key={d.slug} className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] shrink-0">
            <DramaCard drama={d} />
          </div>
        ))}
      </div>
    </section>
  );
}
