import { Link } from "react-router-dom";

type Props = { title: string; kicker?: string; blurb?: string };

export default function Placeholder({ title, kicker = "KDramaWorld", blurb }: Props) {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-20">
      <div className="glass-strong rounded-3xl p-10 md:p-16 relative overflow-hidden text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-25 aurora"
             style={{background:"radial-gradient(circle, var(--accent), transparent 60%)"}} />
        <div className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 aurora"
             style={{background:"radial-gradient(circle, var(--accent-2), transparent 60%)", animationDelay:"-6s"}} />
        <div className="relative max-w-2xl mx-auto rise">
          <span className="kicker">
            <span className="dot" />
            {kicker}
          </span>
          <h1 className="section-title mt-5 text-4xl md:text-6xl leading-tight">
            {title}
          </h1>
          {blurb && <p className="mt-4 text-base md:text-lg" style={{color:"var(--text-muted)"}}>{blurb}</p>}
          <div className="mt-7 inline-flex gap-3 justify-center">
            <Link to="/" className="btn-primary h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
              Back to homepage
            </Link>
            <Link to="/explore" className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
              Browse dramas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
