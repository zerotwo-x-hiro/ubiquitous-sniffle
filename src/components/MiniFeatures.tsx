import { minifeatures } from "@/data";

export default function MiniFeatures() {
  return (
    <section className="relative z-10 px-[4%] py-8 md:py-12">
      <div className="grid md:grid-cols-3 gap-4 md:gap-5">
        {minifeatures.map((m, i) => (
          <a
            key={m.slug}
            href={`/mood/${m.slug}`}
            className="card-hover rounded-xl p-6 overflow-hidden relative block transition"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="absolute top-0 left-0 h-1 w-full"
                 style={{ background: i % 2 === 0 ? "var(--accent)" : "var(--accent-2)" }} />
            <div className="relative">
              <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>{m.eyebrow}</div>
              <h3 className="section-title text-[20px] md:text-[24px] leading-tight" style={{ color: "var(--text)" }}>{m.title}</h3>
              <p className="mt-2 text-sm" style={{color:"var(--text-muted)"}}>{m.blurb}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{color:"var(--accent)"}}>
                {m.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
