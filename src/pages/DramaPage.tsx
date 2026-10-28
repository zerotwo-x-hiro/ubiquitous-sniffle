import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { discover, recent, romance, thrillers, fantasy, topRated, comingSoon, collections, recentlyAdded, featured } from "@/data";
import Poster from "@/components/Poster";
import DramaCard from "@/components/DramaCard";

const ALL = [featured, ...discover, ...recent, ...romance, ...thrillers, ...fantasy, ...topRated, ...comingSoon, ...recentlyAdded, ...collections.flatMap(c => c.items)];

export default function DramaPage() {
  const { slug } = useParams();
  const drama = useMemo(() => ALL.find((d) => d.slug === slug) ?? ALL[0], [slug]);
  const related = useMemo(() => ALL.filter((d) => d.slug !== drama.slug && d.genres.some((g) => drama.genres.includes(g))).slice(0,8), [drama]);

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8">
      <Link to="/" className="text-sm inline-flex items-center gap-1 mb-6 opacity-80 hover:opacity-100"
            style={{color:"var(--text-muted)"}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 19l-7-7 7-7"/></svg>
        Back to home
      </Link>
      <div className="relative glass-strong rounded-3xl overflow-hidden">
        <div className={`absolute inset-0 ${drama.art}`} />
        <div className="absolute inset-0"
             style={{background:"linear-gradient(120deg, rgba(11,6,20,.92) 10%, rgba(11,6,20,.65) 60%, rgba(11,6,20,.3) 100%)"}} />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full blur-3xl opacity-50 aurora"
             style={{background:"radial-gradient(circle,#ff5ea8,transparent 60%)"}} />
        <div className="relative grid md:grid-cols-[280px_1fr] gap-8 p-6 md:p-10 items-start rise">
          <div className="mx-auto md:mx-0 w-[220px] md:w-full">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl floaty" style={{border:"1px solid rgba(255,255,255,.1)"}}>
              <Poster drama={{...drama, title:""}} size="lg" showTitle={false} className="!rounded-none !h-[330px]" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["art-a","art-b","art-c"].map((a,i)=>(
                <div key={a} className={`${a} aspect-[2/3] rounded-lg overflow-hidden opacity-70 hover:opacity-100 transition card-hover cursor-pointer`} />
              ))}
            </div>
          </div>
          <div>
            <span className="kicker"><span className="dot"/>{drama.network ?? "KDramaWorld entry"}</span>
            <h1 className="section-title mt-4 text-4xl md:text-6xl leading-tight text-white">
              {drama.title.split(" ").map((w,i)=>(
                <span key={i} className={i === drama.title.split(" ").length-1 ? "gradient-text italic" : ""}>
                  {w}{" "}
                </span>
              ))}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/80">
              <span className="rating-pill px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc464"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
                {drama.rating > 0 ? drama.rating.toFixed(1) : "Unreleased"}
              </span>
              <span className="opacity-80">·</span><span>{drama.year}</span>
              {drama.episodes && <><span className="opacity-80">·</span><span>{drama.episodes} Episodes</span></>}
              {drama.genres.map((g)=>(
                <span key={g} className="pill rounded-full px-2 py-0.5 text-xs">{g}</span>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-white/85 leading-relaxed">
              {drama.blurb || "A quiet, unforgettable drama that earns its place in the KDramaWorld canon. Every frame chosen carefully; every silence intentional."}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="btn-primary h-11 px-6 rounded-xl inline-flex items-center gap-2 font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Watch trailer
              </button>
              <button className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Add to list
              </button>
              <button className="btn-ghost h-11 w-11 grid place-items-center rounded-xl" aria-label="Share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
              {[
                {k:"Director", v:"Kim Jin-won"},
                {k:"Writer",   v:"Park Hae-young"},
                {k:"Episodes", v: drama.episodes ?? "16"},
                {k:"Airing",   v:"Completed"},
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
