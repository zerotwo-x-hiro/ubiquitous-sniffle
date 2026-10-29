import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveData } from "@/LiveData";
import { deriveStatus, statusLabel } from "@/lib/status";
import type { AnyDrama } from "@/LiveData";

export default function Hero() {
  const { featured, shelves, recentlyAdded } = useLiveData();
  const discover = shelves.find((s) => s.id === "trending" || s.id === "discover")?.items ?? [];

  const slides: AnyDrama[] = useMemo(() => {
    const seen = new Set<string>([featured.slug]);
    const list: AnyDrama[] = [featured];
    const pool: AnyDrama[] = [];
    for (const drama of [...discover, ...recentlyAdded]) {
      if (seen.has(drama.slug)) continue;
      if ((drama as any).poster || (drama as any).backdrop) {
        pool.push(drama);
        seen.add(drama.slug);
      }
      if (pool.length >= 5) break;
    }
    return [...list, ...pool];
  }, [featured, discover, recentlyAdded]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const drama = slides[index];
  if (!drama) return null;

  const backdrop = (drama as any).backdrop as string | undefined;
  const poster = (drama as any).poster as string | undefined;
  const backgroundImage = backdrop || poster;
  const runtime = (drama as any).runtime as number | undefined;
  const status = deriveStatus({
    status: (drama as any).status,
    premiered: `${drama.year}-01-01`,
    ended: (drama as any).status === "Ended" && drama.year ? `${drama.year}-12-31` : undefined,
  });
  const move = (delta: number) => setIndex((current) => (current + delta + slides.length) % slides.length);

  return (
    <section className="hero-section relative w-full" aria-label="Featured Korean drama">
      <div className={`hero-frame relative w-full ${backgroundImage ? "" : drama.art}`}>
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 24%" }}
          />
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-top)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-side)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--hero-fade)" }} />

        <div className="hero-hand-script absolute top-[18%] right-[8%] hidden lg:block" aria-hidden="true">
          <span className="hand-script text-[28px] md:text-[34px]">{"Small\nTown\nBig\nHappiness"}</span>
        </div>

        <div className="hero-content absolute inset-0 flex items-end">
          <div className="relative rise w-full px-[5.5%] pb-8 md:pb-7">
            <div className="hero-kicker flex flex-wrap items-center gap-x-3 gap-y-1 uppercase font-semibold" style={{ color: "var(--text-muted)" }}>
              {drama.genres.slice(0, 4).map((genre, i) => (
                <span key={genre} className="inline-flex items-center gap-3">
                  {i > 0 && <span className="meta-divider" />}
                  <span>{genre}</span>
                </span>
              ))}
            </div>

            <h1 className="hero-title mt-3 md:mt-3 font-bold leading-[.98] max-w-[11ch]" style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>
              {drama.title}
            </h1>

            <div className="hero-meta mt-3 flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: "var(--text)" }}>
              {drama.year && <span>{drama.year}</span>}
              {drama.episodes && <><span className="meta-divider" /><span>{drama.episodes} Episodes</span></>}
              {drama.genres.slice(0, 2).map((genre) => <span key={genre} className="inline-flex items-center"><span className="meta-divider" />{genre}</span>)}
              <span className="meta-divider" />
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--gold)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>
                {drama.rating > 0 ? drama.rating.toFixed(1) : "—"}<span className="font-normal text-xs ml-0.5">/10</span>
              </span>
            </div>

            <p className="hero-synopsis mt-3 max-w-[54ch] leading-[1.42]" style={{ color: "var(--text)", textShadow: "0 1px 12px rgba(0,0,0,.18)" }}>
              {drama.blurb?.length > 220 ? drama.blurb.slice(0, 217) + "…" : drama.blurb}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link to={`/drama/${drama.slug}`} className="hero-primary inline-flex items-center justify-center gap-2 font-semibold">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                Watch Now
              </Link>
              <Link to={`/drama/${drama.slug}`} className="hero-secondary inline-flex items-center justify-center gap-2 font-semibold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                Add to Watchlist
              </Link>
              <span className="hidden xl:inline-flex text-[11px] uppercase tracking-[.12em]" style={{ color: "var(--text-muted)" }}>
                {statusLabel(status)}{runtime ? ` · ${runtime}m/ep` : ""}{drama.network ? ` · ${drama.network}` : ""}
              </span>
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button aria-label="Previous featured drama" onClick={() => move(-1)} className="hero-arrow absolute left-3 md:left-5 top-1/2 -translate-y-1/2">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button aria-label="Next featured drama" onClick={() => move(1)} className="hero-arrow absolute right-3 md:right-5 top-1/2 -translate-y-1/2">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <div className="hero-pagination absolute bottom-5 right-[5.5%] flex items-center gap-2">
              {slides.map((slide, slideIndex) => (
                <button
                  key={slide.slug}
                  aria-label={`Go to featured drama ${slideIndex + 1}: ${slide.title}`}
                  aria-current={slideIndex === index ? "true" : undefined}
                  onClick={() => setIndex(slideIndex)}
                  className={`hero-dot ${slideIndex === index ? "active" : ""}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
