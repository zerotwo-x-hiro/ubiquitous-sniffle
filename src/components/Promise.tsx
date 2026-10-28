const stats = [
  { k: "Live catalogue", v: "Verified entries, updated weekly" },
  { k: "Sourced ratings", v: "TMDB & TVMaze, no invented scores" },
  { k: "Your notes stay yours", v: "Private by default, never sold" },
];

export default function Promise() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-40 aurora"
             style={{background:"radial-gradient(circle,#ff5ea8,transparent 60%)"}} />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full blur-3xl opacity-40 aurora"
             style={{background:"radial-gradient(circle,#4aa8ff,transparent 60%)", animationDelay:"-8s"}} />
        <div className="relative max-w-3xl">
          <h2 className="section-title text-3xl md:text-5xl leading-[1.05]">
            Some stories <span className="gradient-text italic">never leave you.</span>
          </h2>
          <p className="mt-4 text-base md:text-lg" style={{color:"var(--text-muted)"}}>
            No invented scores. No fake trending lists. No community numbers we cannot back up.
            Just a beautiful, honest place to keep the dramas that stayed — and to find the next one.
          </p>
        </div>
        <div className="relative mt-8 grid sm:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.k} className="glass rounded-2xl p-5">
              <div className="text-[11px] uppercase tracking-widest font-semibold" style={{color:"var(--text-dim)"}}>{s.k}</div>
              <div className="mt-1 font-semibold text-base leading-snug">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
