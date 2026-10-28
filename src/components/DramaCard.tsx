import Poster from "./Poster";
import type { Drama } from "@/data";

type Props = { drama: Drama; compact?: boolean };

export default function DramaCard({ drama, compact = false }: Props) {
  return (
    <a href={`/drama/${drama.slug}`} className="group block card-hover">
      <article className="glass rounded-2xl p-2.5">
        <Poster drama={drama} size={compact ? "sm" : "md"} />
        <div className="px-1.5 pt-3 pb-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-[15px] leading-tight line-clamp-2 group-hover:text-white"
                style={{ color: "var(--text)" }}>
              {drama.title}
            </h3>
            <span className="text-[12px] font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
              {drama.year}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {drama.genres.slice(0, 2).map((g) => (
              <span key={g} className="pill rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase"
                    style={{ color: "var(--text-muted)" }}>
                {g}
              </span>
            ))}
            {drama.rating > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold gradient-text">
                ★ {drama.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </article>
    </a>
  );
}
