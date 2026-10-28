import DramaCard from "./DramaCard";
import type { Drama } from "@/data";
import { Link } from "react-router-dom";

type ShelfLike = { id: string; title: string; eyebrow?: string; items: Array<Drama | any> };

export default function Shelf({ shelf }: { shelf: ShelfLike }) {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-10">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          {shelf.eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2"
                 style={{ color: "var(--text-dim)" }}>
              {shelf.eyebrow}
            </div>
          )}
          <h2 className="section-title text-2xl md:text-3xl" style={{ color: "var(--text)" }}>
            {shelf.title}
          </h2>
        </div>
        <Link to="/explore" className="text-sm font-semibold opacity-80 hover:opacity-100 transition inline-flex items-center gap-1 shrink-0"
              style={{ color: "var(--text-muted)" }}>
          See all
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <div className="scroll-x flex gap-4 md:gap-5 overflow-x-auto pb-4 -mx-4 md:-mx-8 lg:-mx-12 px-4 md:px-8 lg:px-12">
        {shelf.items.map((d) => (
          <div key={d.slug} className="w-[170px] md:w-[200px] shrink-0">
            <DramaCard drama={d} />
          </div>
        ))}
      </div>
    </section>
  );
}
