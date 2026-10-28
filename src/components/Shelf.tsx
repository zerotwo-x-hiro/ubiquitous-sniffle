import DramaCard from "./DramaCard";
import RankedCard from "./RankedCard";
import type { Drama } from "@/data";
import { Link } from "react-router-dom";
import type { AnyDrama } from "@/LiveData";
import { useState, useRef } from "react";

type ShelfLike = { id: string; title: string; eyebrow?: string; items: AnyDrama[]; live?: boolean; ranked?: boolean };

type Props = { shelf: ShelfLike };

function ShelfHeader({ shelf }: { shelf: ShelfLike }) {
  const accent = shelf.title.toLowerCase().includes("trending")
    ? "var(--accent)"
    : "var(--accent)";
  return (
    <div className="flex items-end justify-between gap-4 mb-4 px-[4%]">
      <div>
        {shelf.eyebrow && (
          <div
            className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2"
            style={{ color: "var(--text-dim)" }}
          >
            {shelf.eyebrow}
          </div>
        )}
        <h2
          className="section-title text-[22px] md:text-[28px] flex items-center gap-3"
          style={{ color: "var(--text)" }}
        >
          {shelf.title}
          <span
            aria-hidden
            className="hidden sm:inline-block h-[3px] w-12 rounded-full"
            style={{ background: accent, marginTop: 4 }}
          />
        </h2>
      </div>
      <Link
        to="/explore"
        className="text-[13px] md:text-[14px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors"
        style={{ color: "var(--accent)" }}
      >
        View All
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </Link>
    </div>
  );
}

function ChevronButton({ side, onClick, visible }: { side: "left" | "right"; onClick: () => void; visible: boolean }) {
  return (
    <button
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      className={`absolute top-0 bottom-0 z-20 w-[4%] grid place-items-center transition-opacity ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{
        [side]: 0,
        background: side === "left"
          ? "linear-gradient(90deg, rgba(0,0,0,0.7), transparent)"
          : "linear-gradient(270deg, rgba(0,0,0,0.7), transparent)",
      }}
    >
      <div
        className="w-10 h-10 rounded-full grid place-items-center"
        style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {side === "left" ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
        </svg>
      </div>
    </button>
  );
}

export default function Shelf({ shelf }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 20);
  };

  const isRanked = Boolean(shelf.ranked) || shelf.id === "discover" || shelf.id === "trending";

  return (
    <section className="relative z-10 py-6 md:py-8">
      <ShelfHeader shelf={shelf} />
      <div className="relative group">
        <ChevronButton side="left" onClick={() => scrollBy(-1)} visible={showLeft} />
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="scroll-x flex gap-3 md:gap-4 overflow-x-auto pb-6 pt-2 px-[4%]"
        >
          {isRanked
            ? shelf.items.slice(0, 10).map((d, i) => (
                <RankedCard key={d.slug} drama={d} rank={i + 1} />
              ))
            : shelf.items.map((d) => (
                <div key={d.slug} className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] shrink-0">
                  <DramaCard drama={d} />
                </div>
              ))}
        </div>
        <ChevronButton side="right" onClick={() => scrollBy(1)} visible={true} />
      </div>
    </section>
  );
}
