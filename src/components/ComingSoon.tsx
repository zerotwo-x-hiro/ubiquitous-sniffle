import { useLiveData } from "@/LiveData";
import DramaCard from "./DramaCard";

export default function ComingSoon() {
  const { comingSoon, shelves } = useLiveData();
  // Fall back to live "recent" shelf items if no comingSoon data yet.
  const liveRecent = shelves.find((s) => s.live)?.items ?? [];
  const items = comingSoon.length ? comingSoon : liveRecent.slice(0, 6);
  return (
    <section className="relative z-10 px-[4%] py-8 md:py-10">
      <h2 className="section-title text-[22px] md:text-[28px] mb-5 flex items-center gap-3" style={{ color: "var(--text)" }}>
        Upcoming & New
        <span aria-hidden className="hidden sm:inline-block h-[3px] w-12 rounded-full"
              style={{ background: "var(--accent-2)", marginTop: 4 }} />
      </h2>
      {items.length === 0 ? (
        <div className="rounded-lg p-6 text-center text-sm" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
          Upcoming titles will appear here as they're announced.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {items.slice(0, 6).map((d: any) => (
            <DramaCard key={d.slug} drama={d} />
          ))}
        </div>
      )}
    </section>
  );
}
