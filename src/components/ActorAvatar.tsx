import { useState } from "react";

type Props = {
  name: string;
  tmdbProfile?: string;
  size?: number; // diameter in px
  className?: string;
  ring?: boolean;
};

/** Circular actor avatar — loads TMDB w185 headshot when available and falls
 *  back to a gradient circle with initials on load error (network block,
 *  404, offline). Parent controls size so the component works identically on
 *  ActorsIndexPage cards and the ActorPage hero. */
export default function ActorAvatar({ name, tmdbProfile, size = 96, className = "", ring = true }: Props) {
  const [errored, setErrored] = useState(false);
  const initials = name
    .replace(/\([^)]+\)/g, "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const src = tmdbProfile && !errored
    ? `https://image.tmdb.org/t/p/w185${tmdbProfile}`
    : null;

  const fontSize = Math.max(14, Math.round(size * 0.33));

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center font-serif font-bold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        background: "var(--surface)",
        border: ring ? "1px solid var(--border-strong)" : "none",
        color: "var(--text)",
        backdropFilter: "blur(6px)",
      }}
      aria-hidden={false}
      role="img"
      aria-label={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 25%" }}
        />
      ) : (
        <span className="gradient-text select-none">{initials}</span>
      )}
    </div>
  );
}
