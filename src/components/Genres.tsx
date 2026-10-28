import { Link } from "react-router-dom";
import { genres } from "@/data";

// Simple genre chip grid (no more aurora/glow backgrounds behind each tile).
export default function Genres() {
  return (
    <section className="relative z-10 px-[4%] py-8">
      <h2 className="section-title text-[22px] md:text-[28px] mb-5">Browse by Genre</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {genres.map((g) => (
          <Link
            key={g.slug}
            to={`/genre/${g.slug}`}
            className="group relative overflow-hidden rounded-lg h-[100px] md:h-[120px] transition-transform duration-300 hover:scale-[1.03] shadow-md"
            style={{ background: g.accent }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/5" />
            <div className="absolute inset-0 p-4 flex flex-col justify-end">
              <h3 className="text-white text-lg md:text-xl font-bold leading-tight drop-shadow">
                {g.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
