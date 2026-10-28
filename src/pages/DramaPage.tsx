import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import Poster from "@/components/Poster";
import DramaCard from "@/components/DramaCard";
import { useLiveData } from "@/LiveData";
import { deriveStatus, statusLabel, canDisplayRating } from "@/lib/status";
import { useSeo } from "@/lib/seo";
import type { Drama } from "@/data";
import type { EnrichedDrama } from "@/api";

type AnyDrama = Drama | EnrichedDrama;

export default function DramaPage() {
  const { slug } = useParams();
  const { findBySlug, shelves } = useLiveData();
  const drama = useMemo(() => findBySlug(slug ?? ""), [findBySlug, slug]);

  if (!drama) return <NotFound slug={slug} />;

  const backdrop = (drama as EnrichedDrama).backdrop;
  const runtime = (drama as EnrichedDrama).runtime;
  const imdbId = (drama as EnrichedDrama).imdbId;
  const tvStatus = (drama as EnrichedDrama).status;
  const status = deriveStatus({
    status: tvStatus,
    premiered: drama.year ? `${drama.year}-01-01` : undefined,
    ended: tvStatus === "Ended" && drama.year ? `${drama.year}-12-31` : undefined,
  });
  const poster = (drama as EnrichedDrama).poster;
  const ratingLine = canDisplayRating(status, drama.rating)
    ? `★ ${drama.rating.toFixed(1)} on TVMaze`
    : "";
  const metaBits = [drama.year, drama.network, ...drama.genres].filter(Boolean).join(" · ");
  useSeo({
    title: `${drama.title} (${drama.year})`,
    description: `${drama.title} — ${ratingLine ? ratingLine + " · " : ""}${metaBits}. ${drama.blurb || ""}`.slice(0, 200),
    image: poster || (drama as EnrichedDrama).backdrop,
    type: "article",
  });

  const related = useMemo(() => {
    const seen = new Set<string>([drama.slug]);
    const out: AnyDrama[] = [];
    for (const s of shelves) {
      for (const d of s.items) {
        if (seen.has(d.slug)) continue;
        if (!d.genres.some((g: string) => drama.genres.includes(g))) continue;
        seen.add(d.slug);
        out.push(d);
        if (out.length >= 8) break;
      }
      if (out.length >= 8) break;
    }
    return out;
  }, [drama, shelves]);

  const words = drama.title.split(" ");

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8">
      <Link to="/" className="text-sm inline-flex items-center gap-1 mb-6 opacity-80 hover:opacity-100"
            style={{color:"var(--text-muted)"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>
        Back to home
      </Link>
      <div className="relative glass-strong rounded-3xl overflow-hidden">
        <div className={`absolute inset-0 ${drama.art}`} />
        {backdrop && (
          <img src={backdrop} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0"
             style={{background:"linear-gradient(120deg, rgba(11,6,20,.92) 10%, rgba(11,6,20,.65) 60%, rgba(11,6,20,.3) 100%)"}} />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-50 aurora"
             style={{background:"radial-gradient(circle,#ff5ea8,transparent 60%)"}} />
        <div className="relative grid md:grid-cols-[280px_1fr] gap-8 p-6 md:p-10 items-start rise">
          <div className="mx-auto md:mx-0 w-[220px] md:w-full">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl floaty" style={{border:"1px solid rgba(255,255,255,.1)"}}>
              <Poster drama={drama} size="lg" showTitle={false} className="!rounded-none !h-[330px]" />
            </div>
          </div>
          <div>
            <span className="kicker"><span className="dot"/>{drama.network ?? "KDramaWorld"}</span>
            <h1 className="section-title mt-4 text-4xl md:text-6xl leading-tight text-white">
              {words.map((w,i)=>(
                <span key={i} className={i === words.length-1 ? "gradient-text italic" : ""}>
                  {w}{" "}
                </span>
              ))}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
              <span className="rating-pill px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                {canDisplayRating(status, drama.rating) ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc464"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
                    {drama.rating.toFixed(1)} <span className="text-white/60 text-[11px] ml-1 font-normal">TVMaze</span>
                  </>
                ) : (
                  <span className="text-pink-200/90 uppercase tracking-widest text-[10px]">Not rated yet</span>
                )}
              </span>
              <span className="opacity-80">·</span><span>{drama.year}</span>
              {drama.episodes && <><span className="opacity-80">·</span><span>{drama.episodes} Episodes</span></>}
              {runtime && <><span className="opacity-80">·</span><span>{runtime} min/ep</span></>}
              <span className="opacity-80">·</span>
              <span className="pill rounded-full px-2 py-0.5 text-xs">{statusLabel(status)}</span>
              {drama.genres.map((g)=>(
                <span key={g} className="pill rounded-full px-2 py-0.5 text-xs">{g}</span>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-white/85 leading-relaxed">
              {drama.blurb || "A quiet, unforgettable drama that earns its place in the KDramaWorld canon."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/explore" className="btn-primary h-11 px-6 rounded-xl inline-flex items-center gap-2 font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Browse similar
              </Link>
              {imdbId && (
                <a href={`https://www.imdb.com/title/${imdbId}/`} target="_blank" rel="noopener noreferrer nofollow"
                   className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold">
                  IMDb
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
                </a>
              )}
              <a
                href={`https://mydramalist.com/search?q=${encodeURIComponent(drama.title)}`}
                target="_blank" rel="noopener noreferrer nofollow"
                className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold"
              >
                Search on MyDramaList
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              {[
                {k:"Year",     v: drama.year},
                {k:"Episodes", v: drama.episodes ?? "—"},
                {k:"Runtime",  v: runtime ? `${runtime} min` : "—"},
                {k:"Status",   v: statusLabel(status)},
              ].map(s=>(
                <div key={s.k} className="glass rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-widest" style={{color:"rgba(255,255,255,.6)"}}>{s.k}</div>
                  <div className="mt-1 text-white font-semibold text-sm">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-2xl md:text-3xl mb-5">More like this</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map(d => <DramaCard key={d.slug} drama={d} compact />)}
          </div>
        </section>
      )}
    </section>
  );
}

function NotFound({ slug }: { slug?: string }) {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-16 max-w-2xl mx-auto text-center">
      <div className="text-7xl md:text-8xl font-serif italic gradient-text mb-4">404</div>
      <h1 className="section-title text-3xl md:text-4xl mb-3">Drama not found</h1>
      <p className="text-white/70 mb-8">
        We couldn't find a drama matching <code className="px-1.5 py-0.5 rounded glass text-sm">{slug ?? ""}</code>.
        It may have been renamed or removed.
      </p>
      <Link to="/" className="btn-primary h-11 px-6 rounded-xl inline-flex items-center gap-2 font-semibold">
        Back to home
      </Link>
    </section>
  );
}
