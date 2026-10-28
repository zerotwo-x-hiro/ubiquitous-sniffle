import { Link, useParams, Navigate } from "react-router-dom";
import { actors } from "@/data";
import { useLiveData } from "@/LiveData";
import DramaCard from "@/components/DramaCard";
import ActorAvatar from "@/components/ActorAvatar";
import { useSeo } from "@/lib/seo";

// Map curated actors to slugs of dramas they appear in (manually curated;
// TVMaze cast data would supersede this once the serverless layer ships).
const FILMOGRAPHY: Record<string, string[]> = {
  "lee-ji-eun":       ["my-mister", "moon-lovers", "my-dearest"],
  "lee-dong-wook":    ["goblin", "tunnel"],
  "gong-hyo-jin":     ["coffee-prince", "when-life-gives-you-tangerines"],
  "kim-go-eun":       ["goblin", "mr-sunshine"],
  "hyun-bin":         ["crash-landing-on-you", "secret-garden", "mr-sunshine"],
  "son-ye-jin":       ["crash-landing-on-you", "mr-sunshine"],
  "park-seo-joon":    ["fight-for-my-way", "whats-wrong-with-secretary-kim"],
  "kim-soo-hyun":     ["moon-lovers", "crash-landing-on-you", "my-love-from-the-star"],
};

export default function ActorPage() {
  const { slug } = useParams<{ slug: string }>();
  const actor = actors.find((a) => a.slug === slug);
  const { findBySlug } = useLiveData();

  useSeo({
    title: actor ? `${actor.name} — Filmography` : "Actor",
    description: actor
      ? `${actor.name} filmography on KDramaWorld — dramas they appear in, with ratings, posters and details.`
      : "Actor filmography on KDramaWorld.",
  });

  if (!actor) return <Navigate to="/actors" replace />;

  const dramaSlugs = FILMOGRAPHY[actor.slug] || [];
  const dramas = dramaSlugs.map((s) => findBySlug(s)).filter(Boolean) as any[];

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <Link to="/actors" className="text-sm hover:underline" style={{ color: "var(--text-muted)" }}>
          ← All actors
        </Link>
        <div className="mt-6 flex flex-col md:flex-row items-center md:items-start gap-8">
          <ActorAvatar
            name={actor.name}
            tmdbProfile={actor.tmdbProfile}
            size={144}
            className="ring-2 shadow-2xl"
          />
          <div className="text-center md:text-left">
            <span className="kicker"><span className="dot" />Filmography</span>
            <h1 className="section-title mt-2 text-4xl md:text-6xl font-serif">{actor.name}</h1>
            <p className="mt-3 max-w-xl" style={{ color: "var(--text-muted)" }}>
              Appears in {dramas.length} {dramas.length === 1 ? "drama" : "dramas"} we cover.
              Filmography links back to dramas in the KDramaWorld catalogue.
            </p>
          </div>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-bold">In the archive</h2>
        {dramas.length === 0 ? (
          <p className="mt-3" style={{ color: "var(--text-muted)" }}>
            No films of this actor in our curated catalogue yet — check back as the archive grows.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {dramas.map((d) => <DramaCard key={d.slug} drama={d} />)}
          </div>
        )}
      </div>
    </section>
  );
}
