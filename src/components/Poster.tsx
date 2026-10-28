import type { Drama } from "@/data";

type Props = { drama: Drama; className?: string; showTitle?: boolean; size?: "sm" | "md" | "lg" };

export default function Poster({ drama, className = "", showTitle = true, size = "md" }: Props) {
  const h = size === "sm" ? "h-56" : size === "lg" ? "h-80" : "h-72";
  return (
    <div className={`poster ${drama.art} ${h} w-full ${className}`} role="img" aria-label={drama.title}>
      <div className="absolute inset-0 opacity-30 mix-blend-overlay"
           style={{ backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,.35), transparent 40%), radial-gradient(circle at 80% 90%, rgba(0,0,0,.4), transparent 50%)" }} />
      {/* decorative ornament */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-50 aurora"
           style={{ background: "radial-gradient(circle, rgba(255,255,255,.35), transparent 60%)" }} />
      <span className="absolute top-2 left-2 rating-pill text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
        {drama.rating > 0 ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffc464" aria-hidden>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
            </svg>
            {drama.rating.toFixed(1)}
          </>
        ) : (
          <span className="text-pink-200/90 uppercase tracking-widest text-[10px]">Soon</span>
        )}
      </span>
      {drama.network && (
        <span className="absolute top-2 right-2 pill rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/80">
          {drama.network}
        </span>
      )}
      {showTitle && (
        <div className="title-plate">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/70 mb-1">
            {drama.year}{drama.episodes ? ` · ${drama.episodes} eps` : ""}
          </div>
          <div className="text-lg leading-tight drop-shadow-lg">{drama.title}</div>
        </div>
      )}
    </div>
  );
}
