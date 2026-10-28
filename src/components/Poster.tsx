import type { AnyDrama } from "@/LiveData";

type Props = { drama: AnyDrama; size?: string; showTitle?: boolean; className?: string; [key: string]: any };

// Netflix-style standalone poster for the drama detail page.
export default function Poster({ drama }: Props) {
  const d = drama as any;
  const poster = d.poster || d.posterOriginal || null;
  return (
    <div className={`poster aspect-[2/3] w-full max-w-[320px] ${drama.art} rounded-md shadow-2xl overflow-hidden relative`}>
      {poster ? (
        <img
          src={poster}
          alt={drama.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      ) : null}
    </div>
  );
}
