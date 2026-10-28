import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-10 px-4 md:px-8 lg:px-12 pt-10 pb-14">
      <div className="glass-strong rounded-3xl p-8 md:p-10 relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-30 aurora"
             style={{background:"radial-gradient(circle,#9b5cff,transparent 60%)"}} />
        <div className="relative grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl grid place-items-center font-black text-white"
                    style={{background:"linear-gradient(135deg,#ff5ea8,#9b5cff,#4aa8ff)", boxShadow:"var(--shadow-glow)"}}>K</span>
              <span className="font-display text-2xl font-black tracking-tight">
                KDrama<span className="gradient-text">World</span>
              </span>
            </Link>
            <p className="mt-4 text-sm max-w-sm" style={{color:"var(--text-muted)"}}>
              Your world of Korean dramas. Honest catalogues, real ratings, editorial picks — no algorithms, no noise.
            </p>
            <form className="mt-5 flex gap-2 max-w-sm" onSubmit={(e)=>e.preventDefault()}>
              <input type="email" placeholder="your@email.com"
                     className="flex-1 h-11 rounded-xl px-4 text-sm outline-none transition focus:border-transparent"
                     style={{background:"var(--bg-elev)", border:"1px solid var(--border-strong)", color:"var(--text)"}} />
              <button className="btn-primary h-11 px-4 rounded-xl text-sm font-semibold">Subscribe</button>
            </form>
            <p className="mt-2 text-[11px]" style={{color:"var(--text-dim)"}}>
              Weekly watchlist. Unsubscribe anytime.
            </p>
          </div>
          {[
            { h: "Explore", links: [["/explore","Browse all"],["/discover","Top rated"],["/genres","Genres"],["/actors","Actors"],["/lists","Collections"]] },
            { h: "Features", links: [["/midnight-watchlist","Midnight Watchlist"],["/second-lead-syndrome","Second Lead Syndrome"],["/emotional-damage","Emotional Damage Meter"]] },
            { h: "About", links: [["/about","Our promise"],["/sources","Sources"],["/privacy","Privacy"],["/terms","Terms"]] },
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
          <div className="text-xs" style={{color:"var(--text-dim)"}}>
            © {new Date().getFullYear()} KDramaWorld. Metadata © TMDB & TVMaze. Made with ♡ for people who rewatch the same OST.
          </div>
          <div className="flex items-center gap-2">
            {["𝕏","IG","YT","TT"].map(s=>(
              <a key={s} href="#" aria-label={s}
                 className="w-9 h-9 rounded-xl grid place-items-center btn-ghost text-sm font-semibold">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
