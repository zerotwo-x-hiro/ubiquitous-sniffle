import type { AnyDrama } from "@/LiveData";

type Props = {
  drama: AnyDrama;
  rank: number;
};

// Netflix "Top 10" style ranked card: large outlined serif rank number behind
// a 2:3 poster on the right.
export default function RankedCard({ drama, rank }: Props) {
  const d: any = drama;
  const poster = d.poster || d.posterOriginal || null;
  return (
    <a
      href={`/drama/${drama.slug}`}
      className="rank-card group flex shrink-0 items-end w-[290px] sm:w-[320px] md:w-[360px] lg:w-[400px] select-none"
      aria-label={`${drama.title} (rank ${rank})`}
    >
      {/* Giant number */}
      <span
        className="rank-badge"
        style={{
          textShadow: "none",
        }}
      >
        {rank}
      </span>

      {/* Poster */}
      <div className="relative ml-10 w-[120px] sm:w-[130px] md:w-[140px] lg:w-[150px] shrink-0">
        <div
          className={`poster aspect-[2/3] w-full ${drama.art} shadow-2xl rounded-sm overflow-hidden relative`}
        >
          {poster ? (
            <img
              src={poster}
              alt={drama.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : null}
        </div>
        {/* Title + year strip under poster, like Netflix */}
        <div className="mt-2 pr-1">
          <div
            className="text-[13px] md:text-[14px] font-semibold leading-tight line-clamp-2"
            style={{ color: "var(--text)" }}
          >
            {drama.title}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: "var(--text-dim)" }}>
            {drama.year && <span>{drama.year}</span>}
            {drama.episodes && (
              <>
                <span>·</span>
                <span>{drama.episodes} EP</span>
              </>
            )}
            {drama.rating > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1" style={{ color: "var(--gold)" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </svg>
                  {drama.rating.toFixed(1)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
