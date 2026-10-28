import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-10 px-4 md:px-8 lg:px-12 pt-10 pb-14">
      <div className="glass-strong rounded-3xl p-8 md:p-10 relative overflow-hidden hanji">
        <span className="hanja-mark" style={{ bottom: "-6rem", left: "-2rem", fontSize: "clamp(12rem,22vw,22rem)" }} aria-hidden>드</span>
        <div className="absolute -top-10 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 aurora"
             style={{background:"radial-gradient(circle,#9b5cff,transparent 60%)"}} />
        <div className="relative grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="dojang" aria-hidden>韓</span>
              <span className="leading-none">
                <span className="font-display text-2xl font-black tracking-tight block">
                  KDrama<span className="gradient-text">World</span>
                </span>
                <span className="font-hangul text-[10px] block mt-0.5 tracking-widest" style={{color:"var(--text-dim)"}}>
                  한국 드라마 · 影像世界
                </span>
              </span>
            </Link>
            <p className="mt-4 text-sm max-w-sm" style={{color:"var(--text-muted)"}}>
              Your world of Korean dramas. Honest catalogues, real ratings, editorial picks — no algorithms, no noise.
            </p>
            <p className="mt-5 text-sm max-w-sm" style={{color:"var(--text-muted)"}}>
              New K-dramas are added to the live catalogue automatically as they air.
              Bookmark this page or follow us — no newsletter, no spam.
            </p>
          </div>
          {[
            { h: "Explore", links: [["/explore","Browse all"],["/discover","Top rated"],["/genres","Genres"],["/actors","Actors"],["/lists","Collections"]] },
            { h: "Features", links: [["/midnight-watchlist","Midnight Watchlist"],["/second-lead-syndrome","Second Lead Syndrome"],["/emotional-damage","Emotional Damage Meter"]] },
            { h: "About", links: [["/about","About"],["/sources","Data sources"],["/privacy","Privacy"],["/terms","Terms"]] },
          ].map((col)=>(
            <div key={col.h}>
              <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-4" style={{color:"var(--text-dim)"}}>{col.h}</div>
              <ul className="space-y-2.5">
                {col.links.map(([to,l])=>(
                  <li key={to}>
                    <Link to={to} className="text-sm hover:underline" style={{color:"var(--text-muted)"}}>{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="relative mt-10 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
             style={{borderTop:"1px solid var(--border)"}}>
          <div className="flex items-center gap-3">
            <span className="taegeuk" aria-hidden />
            <div className="text-xs leading-relaxed" style={{color:"var(--text-dim)"}}>
              © {new Date().getFullYear()} KDramaWorld. Metadata courtesy of TVMaze (tvmaze.com).<br className="hidden md:block" />
              Made with ♡ for people who rewatch the same OST. <span className="font-hangul">잘 보고 갑니다 — 오늘도 행복하세요.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "X", href: "https://x.com/" },
              { label: "IG", href: "https://instagram.com/" },
            ].map(s=>(
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                 className="w-9 h-9 rounded-xl grid place-items-center btn-ghost text-sm font-semibold">{s.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
