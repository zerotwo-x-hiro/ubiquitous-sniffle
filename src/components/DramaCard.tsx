import { Link } from "react-router-dom";
import type { AnyDrama } from "@/LiveData";

type Props = {
  drama: AnyDrama;
  compact?: boolean;
  showTitle?: boolean;
  size?: string;
  className?: string;
  [key: string]: any;
};

// Netflix-style poster card: clean 2:3 poster with subtle hover scale,
// title + meta line below (no gradient glass, no dojang/taegeuk/aurora).
export default function DramaCard({ drama }: Props) {
  const d: any = drama;
  const poster = d.poster || d.posterOriginal || null;
  const yearTag = d.isNew ? "New" : d.year ? String(d.year) : null;
  return (
    <Link
      to={`/drama/${drama.slug}`}
      className="group block no-underline"
    >
      <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-neutral-900 shadow-md transition-transform duration-300 group-hover:scale-[1.04] group-hover:shadow-2xl">
        {poster ? (
          <img
            src={poster}
            alt={drama.title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div className={`absolute inset-0 ${drama.art}`} />
        )}
        {/* subtle bottom gradient for metadata legibility when poster has light bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {drama.rating > 0 && (
          <div
            className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(0,0,0,0.6)", color: "var(--gold)" }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.43 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
            </svg>
            {drama.rating.toFixed(1)}
          </div>
        )}
        {yearTag && (
          <div className="absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 rounded"
               style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
            {yearTag}
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-[13.5px] md:text-[14px] font-semibold leading-tight line-clamp-2"
             style={{ color: "var(--text)" }}>
          {drama.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11.5px]" style={{ color: "var(--text-dim)" }}>
          {drama.episodes && <span>{drama.episodes} EP</span>}
          {drama.genres.slice(0, 2).map(g => (
            <span key={g} className="inline-flex items-center gap-2">
              <span>·</span>
              <span>{g}</span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
