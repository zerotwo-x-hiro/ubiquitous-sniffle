import { Link } from "react-router-dom";
import { actors } from "@/data";
import { useSeo } from "@/lib/seo";

// Korean-name syllable palette, decorative backdrop behind each actor tile.
const ART = ["art-a", "art-b", "art-c", "art-d", "art-e", "art-f", "art-g", "art-h"];

export default function ActorsIndexPage() {
  useSeo({
    title: "Actors",
    description: "Korean actors in the KDramaWorld universe — filmographies link back to dramas in the archive.",
  });
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <span className="kicker"><span className="dot" />On screen</span>
        <h1 className="section-title mt-3 text-4xl md:text-5xl">Actors</h1>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--text-muted)" }}>
          Faces that carried these stories. Filmographies link back to dramas in our catalogue — no
          paparazzi pages, no tabloid noise.
        </p>
        <div className="mt-10 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {actors.map((a, i) => {
            const initials = a.name
              .replace(/\([^)]+\)/g, "")
              .trim()
              .split(/\s+/)
              .map((w) => w[0])
              .slice(0, 2)
              .join("");
            return (
              <Link key={a.slug} to={`/actors/${a.slug}`}
                    className="group glass rounded-2xl p-5 block relative overflow-hidden card-hover">
                <div className={`absolute inset-0 opacity-30 ${ART[i % ART.length]}`} />
                <div className="relative flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full flex items-center justify-center font-serif text-4xl font-bold gradient-text"
                       style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {initials}
                  </div>
                  <h3 className="mt-4 font-semibold text-lg leading-tight">{a.name}</h3>
                  <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                    Filmography
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>
          Full cast/filmography data loads from TVMaze once we add per-actor IDs. Curated names are
          hand-picked for our editorial universe.
        </p>
      </div>
    </section>
  );
}
