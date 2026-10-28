import { minifeatures } from "@/data";

export default function MiniFeatures() {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
      <div className="grid md:grid-cols-3 gap-4 md:gap-5">
        {minifeatures.map((m) => (
          <a key={m.slug} href={`/${m.slug}`} className="card-hover glass-strong rounded-2xl p-6 overflow-hidden relative block">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-40"
                 style={{ background: `radial-gradient(circle, ${m.accent}, transparent 60%)` }} />
            <div className="relative">
              <div className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-2" style={{color:"var(--text-dim)"}}>{m.eyebrow}</div>
              <h3 className="section-title text-2xl md:text-[28px] leading-tight">{m.title}</h3>
              <p className="mt-2 text-sm" style={{color:"var(--text-muted)"}}>{m.blurb}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{color:m.accent}}>
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
