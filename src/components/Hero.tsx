import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveData } from "@/LiveData";
import { deriveStatus, statusLabel } from "@/lib/status";
import type { AnyDrama } from "@/LiveData";

/**
 * Netflix-style hero carousel:
 *   - Full viewport-width cinematic banner with a real-poster/backdrop image.
 *   - Left-aligned metadata: kicker genre tags, huge serif title, meta row,
 *     synopsis, "Watch Now" + "Add to Watchlist" action buttons.
 *   - Round arrow buttons left/right + pagination dots at bottom.
 *   - Carousel autoplays every 7s, pauses on hover/arrow interaction.
 *
 * Rotates through a small editorial list of hero-worthy dramas (featured +
 * curated top-rated).
 */
export default function Hero() {
  const { featured, shelves, recentlyAdded } = useLiveData();
  const discover = shelves.find((s) => s.id === "trending" || s.id === "discover")?.items ?? [];

  // Build a rotating hero list: featured first, then a handful of high-rated
  // titles (deduplicated).
  const slides: AnyDrama[] = useMemo(() => {
    const seen = new Set<string>([featured.slug]);
    const list: AnyDrama[] = [featured];
    const pool: AnyDrama[] = [];
    // Prefer posters/backdrops for a cinematic background.
    const candidates = [...discover, ...recentlyAdded];
    for (const d of candidates) {
      if (seen.has(d.slug)) continue;
      if ((d as any).poster || (d as any).backdrop) {
        pool.push(d);
        seen.add(d.slug);
      }
      if (pool.length >= 5) break;
    }
    return [...list, ...pool];
  }, [featured, discover, recentlyAdded]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [slides.length]);

  const drama = slides[index];
  if (!drama) return null;

  const backdrop = (drama as any).backdrop as string | undefined;
  const poster = (drama as any).poster as string | undefined;
  const bg = backdrop || poster;
  const tvStatus = (drama as any).status;
  const runtime = (drama as any).runtime as number | undefined;
  const status = deriveStatus({
    status: tvStatus,
    premiered: `${drama.year}-01-01`,
    ended: tvStatus === "Ended" && drama.year ? `${drama.year}-12-31` : undefined,
  });
  const go = (delta: number) =>
    setIndex((i) => (i + delta + slides.length) % slides.length);

  const genreTags = drama.genres.slice(0, 4);

  return (
    <section className="relative w-full" style={{ marginTop: -76 }}>
      {/* Cinematic backdrop */}
      <div className="relative w-full" style={{ aspectRatio: "16/7", minHeight: 520, maxHeight: "82vh" }}>
        {/* Image */}
        <div className={`absolute inset-0 ${bg ? "" : drama.art}`} aria-hidden>
          {bg && (
            <img
              src={bg}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
          )}
        </div>
        {/* Top fade (for the nav) */}
        <div className="absolute inset-0" style={{ background: "var(--hero-top)" }} />
        {/* Left-to-right dark fade for the text */}
        <div className="absolute inset-0" style={{ background: "var(--hero-side)" }} />
        {/* Bottom fade to blend into next section */}
        <div className="absolute inset-0" style={{ background: "var(--hero-fade)" }} />

        {/* Light mode hand-script accent in top right (matches the ref "Small Town…") */}
        <div className="hidden lg:block absolute top-[18%] right-[8%]">
          <span className="hand-script text-[28px] md:text-[34px]">
            {"Small\nTown\nBig\nHappiness"}
          </span>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="relative rise px-[4%] pb-[8%] md:pb-[7%] w-full">
            {/* Genre / eyebrow row */}
            <div className="flex items-center gap-3 text-[11px] md:text-[12px] uppercase tracking-[0.28em] font-semibold"
                 style={{ color: "var(--text-muted)" }}>
              {genreTags.map((g: string, i: number) => (
                <span key={g} className="flex items-center gap-3">
                  {i > 0 && <span className="meta-divider" />}
                  <span>{g}</span>
                </span>
              ))}
            </div>

            {/* Title */}
            <h1
              className="mt-3 md:mt-4 text-[40px] sm:text-[56px] md:text-[72px] lg:text-[96px] font-black leading-[0.92] tracking-tight max-w-[14ch]"
              style={{
                color: "var(--text)",
                fontFamily: "var(--font-sans)",
                textShadow: "0 4px 24px rgba(0,0,0,0.55)",
              }}
            >
              {drama.title}
            </h1>

            {/* Meta row */}
            <div
              className="mt-3 md:mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] md:text-[16px]"
              style={{ color: "var(--text)" }}
            >
              {drama.year && <span className="font-semibold">{drama.year}</span>}
              {drama.episodes && (
                <>
                  <span className="meta-divider" />
                  <span>{drama.episodes} Episodes</span>
                </>
              )}
              {drama.genres.slice(0, 2).map((g) => (
                <span key={g}>
                  <span className="meta-divider" />
                  <span>{g}</span>
                </span>
              ))}
              <span className="meta-divider" />
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--gold)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
                {drama.rating > 0 ? drama.rating.toFixed(1) : "—"}
                <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 12, marginLeft: 2 }}>/10</span>
              </span>
            </div>

            {/* Synopsis */}
            <p
              className="mt-3 md:mt-4 max-w-[55ch] text-[14px] md:text-[18px] leading-[1.4]"
              style={{ color: "var(--text)", textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
            >
              {drama.blurb?.length > 220 ? drama.blurb.slice(0, 217) + "…" : drama.blurb}
            </p>

            {/* Buttons */}
            <div className="mt-5 md:mt-6 flex items-center gap-3">
              <Link
                to={`/drama/${drama.slug}`}
                className="h-11 md:h-12 px-5 md:px-7 rounded-md inline-flex items-center gap-2 font-bold text-[15px] md:text-[16px]"
                style={{ background: "#ffffff", color: "#000" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Watch Now
              </Link>
              <Link
                to={`/drama/${drama.slug}`}
                className="h-11 md:h-12 px-5 md:px-7 rounded-md inline-flex items-center gap-2 font-semibold text-[15px] md:text-[16px] btn-ghost"
                style={{ color: "#fff" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add to Watchlist
              </Link>
              <span
                className="ml-2 hidden md:inline-flex text-[12px] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {statusLabel(status)} · {runtime ? `${runtime}m/ep · ` : ""}{drama.network || "TVMaze"}
              </span>
            </div>
          </div>
        </div>

        {/* Left / right arrows */}
        <button aria-label="Previous" onClick={() => go(-1)} className="hero-arrow absolute left-2 md:left-4 top-1/2 -translate-y-1/2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button aria-label="Next" onClick={() => go(1)} className="hero-arrow absolute right-2 md:right-4 top-1/2 -translate-y-1/2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 md:bottom-8 left-[4%] flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`hero-dot ${i === index ? "active" : ""}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
