import { Link } from "react-router-dom";

type Block = { h?: string; p?: string; bullets?: string[] };

export default function StaticPage({
  kicker,
  title,
  updated,
  blocks,
}: {
  kicker: string;
  title: string;
  updated: string;
  blocks: Block[];
}) {
  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-3xl mx-auto prose-invert">
        <span className="kicker"><span className="dot" />{kicker}</span>
        <h1 className="section-title mt-3 text-4xl md:text-5xl font-serif">{title}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Last updated {updated}
        </p>
        <div className="mt-8 space-y-6">
          {blocks.map((b, i) => (
            <div key={i}>
              {b.h && <h2 className="font-serif text-xl font-bold mt-0 mb-2">{b.h}</h2>}
              {b.p && <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>{b.p}</p>}
              {b.bullets && (
                <ul className="list-disc pl-6 space-y-1 text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                  {b.bullets.map((x, j) => <li key={j}>{x}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Link to="/" className="btn-ghost h-11 px-5 rounded-xl inline-flex items-center gap-2 font-semibold text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
