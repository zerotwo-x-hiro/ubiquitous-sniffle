import { Link } from "react-router-dom";
import { featured } from "@/data";
import Poster from "./Poster";

export default function Hero() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 pt-8 md:pt-14 pb-4">
      <div className="relative glass-strong rounded-3xl overflow-hidden">
        {/* Backdrop */}
        <div className={`absolute inset-0 ${featured.art}`} aria-hidden />
        <div className="absolute inset-0"
             style={{ background: "linear-gradient(120deg, rgba(11,6,20,.85) 10%, rgba(11,6,20,.55) 50%, rgba(11,6,20,.2) 100%)" }} />
        <div className="absolute -top-16 -right-10 w-[480px] h-[480px] rounded-full aurora"
             style={{ background: "radial-gradient(circle, rgba(255,94,168,.5), transparent 60%)" }} aria-hidden />
        <div className="absolute -bottom-20 -left-20 w-[520px] h-[520px] rounded-full aurora"
             style={{ background: "radial-gradient(circle, rgba(74,168,255,.45), transparent 60%)", animationDelay: "-6s" }} aria-hidden />

        <div className="relative rise grid md:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-12 p-6 md:p-10 lg:p-14 items-center">
          <div>
            <span className="kicker">
              <span className="dot" />
              {featured.tagline}
            </span>
            <h1 className="section-title mt-5 text-4xl md:text-6xl lg:text-7xl leading-[0.95]" style={{ color:"#fff" }}>
              {featured.title.split(" ").map((w,i)=> (
                <span key={i} className={i === 1 ? "gradient-text italic" : ""}>
                  {w}{i < featured.title.split(" ").length-1 ? " " : ""}
                </span>
              ))}
            </h1>
            <div className="mt-4 flex items-center flex-wrap gap-3 text-sm text-white/80">
              <span className="rating-pill px-2.5 py-1 rounded-full text-white flex items-center gap-1.5 font-semibold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffc464"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
                {featured.rating.toFixed(1)}
              </span>
              <span className="opacity-80">·</span>
              <span>{featured.year}</span>
              <span className="opacity-80">·</span>
              <span>{featured.episodes} Episodes</span>
              <span className="opacity-80">·</span>
              <span className="flex gap-1.5">
                {featured.genres.map((g)=>(
                  <span key={g} className="pill rounded-full px-2 py-0.5 text-xs">{g}</span>
                ))}
              </span>
            </div>
            <p className="mt-5 max-w-xl text-base md:text-lg text-white/85 leading-relaxed">
              {featured.blurb}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={`/drama/${featured.slug}`} className="btn-primary h-11 px-6 rounded-xl inline-flex items-center gap-2 font-semibold">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Explore
              </Link>
              <Link to={`/drama/${featured.slug}`} className="btn-ghost h-11 px-6 rounded-xl inline-flex items-center gap-2 font-semibold">
                More info
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <div className="flex -space-x-2 ml-2">
                {["art-b","art-c","art-d","art-e"].map(a=>(
                  <div key={a} className={`w-8 h-8 rounded-full border-2 ${a}`} style={{ borderColor:"rgba(0,0,0,.5)" }} />
                ))}
              </div>
              <div className="text-xs text-white/70"><b className="text-white">12k+</b> viewers this week</div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="floaty relative mx-auto w-[280px] lg:w-[320px]">
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-60"
                   style={{ background: "linear-gradient(135deg,#ff5ea8,#9b5cff,#4aa8ff)" }} />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <Poster drama={featured} size="lg" showTitle={false} className="!rounded-none" />
                <div className="absolute inset-x-0 bottom-0 p-5 z-10"
                     style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,.8))" }}>
                  <div className="text-white font-display italic text-2xl leading-tight">
                    {featured.title}
                  </div>
                  <div className="text-white/70 text-xs uppercase tracking-widest mt-1">
                    {featured.network} · {featured.year}
                  </div>
                  <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-[64%] rounded-full"
                         style={{ background: "linear-gradient(90deg,#ff5ea8,#9b5cff,#4aa8ff)" }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-white/70">
                    <span>Continue · Ep 7</span><span>43 min left</span>
                  </div>
                </div>
              </div>
              {/* Floating info pill */}
              <div className="glass-strong absolute -left-6 -bottom-6 rounded-2xl px-3 py-2.5 floaty shadow-xl" style={{ animationDelay: "-2s" }}>
                <div className="text-[10px] uppercase tracking-widest text-white/70">Now trending</div>
                <div className="text-white text-sm font-semibold">#1 in 14 countries</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
