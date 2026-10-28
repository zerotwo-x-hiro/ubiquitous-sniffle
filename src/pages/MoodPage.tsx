import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveData } from "@/LiveData";
import DramaCard from "@/components/DramaCard";

type Mood = {
  eyebrow: string;
  title: string;
  blurb: string;
  prompts: Array<{ q: string; slugs: string[] }>;
};

const MOODS: Record<string, Mood> = {
  "midnight-watchlist": {
    eyebrow: "01 · Mood recommender",
    title: "Midnight Watchlist",
    blurb: "Tell us what you're in the mood for and we'll hand you one obsession — with a reason, not a vibe.",
    prompts: [
      { q: "I want to cry happy-sad tears until 2 AM", slugs: ["my-mister", "reply-1988", "mr-sunshine", "goblin", "twenty-five-twenty-one"] },
      { q: "Give me something tight and twisty that won't let me look away", slugs: ["signal", "flower-of-evil", "tunnel", "mouse", "strangers-from-hell"] },
      { q: "I need a romance that actually feels like falling", slugs: ["business-proposal", "crash-landing-on-you", "weightlifting-fairy", "coffee-prince", "lovely-runner"] },
      { q: "Give me world-building and swords and a slow-burn myth", slugs: ["alchemy-of-souls", "arthdal", "kingdom", "goblin", "moon-lovers"] },
      { q: "Show me something hopeful that heals something", slugs: ["hospital-playlist", "daily-dose-of-sunshine", "fight-for-my-way", "extraordinary-attorney-woo", "my-liberation-notes"] },
    ],
  },
  "second-lead-syndrome": {
    eyebrow: "02 · Hall of fame",
    title: "Second Lead Syndrome",
    blurb: "The characters who deserved their own happy ending and didn't get one. We are still not over it.",
    prompts: [
      { q: "The original wound", slugs: ["reply-1988", "goblin"] },
      { q: "They deserved the world", slugs: ["moon-lovers", "twenty-five-twenty-one", "mr-sunshine"] },
      { q: "The quiet ones who waited", slugs: ["healer", "chicago-typewriter", "run-on", "flower-of-evil"] },
    ],
  },
  "emotional-damage": {
    eyebrow: "03 · Tracker",
    title: "Emotional Damage Meter",
    blurb: "Some dramas end. The damage doesn't. We logged exactly how destroyed we were — honestly, no flexing.",
    prompts: [
      { q: "Mildly bruised but fine", slugs: ["business-proposal", "coffee-prince", "weightlifting-fairy"] },
      { q: "Stared at a wall for 24 hours", slugs: ["twenty-five-twenty-one", "reply-1988", "goblin", "my-mister"] },
      { q: "Had to call a friend", slugs: ["mr-sunshine", "moon-lovers", "flower-of-evil", "youth-of-may"] },
      { q: "Therapy. Now.", slugs: ["the-glory", "mouse", "squid-game", "sky-castle", "signal"] },
    ],
  },
};

export default function MoodPage({ kind }: { kind: keyof typeof MOODS }) {
  const mood = MOODS[kind];
  const { findBySlug } = useLiveData();
  const [open, setOpen] = useState<number | null>(0);

  const resolved = useMemo(() =>
    mood.prompts.map((p) => ({
      ...p,
      dramas: p.slugs.map((s) => findBySlug(s)).filter(Boolean) as any[],
    })),
    [mood, findBySlug]);

  return (
    <section className="relative z-10 px-4 md:px-8 lg:px-12 py-10 md:py-16">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="text-sm hover:underline" style={{ color: "var(--text-muted)" }}>← Home</Link>
        <span className="kicker mt-4 block"><span className="dot" />{mood.eyebrow}</span>
        <h1 className="section-title mt-3 text-4xl md:text-6xl font-serif">{mood.title}</h1>
        <p className="mt-3 text-lg max-w-2xl" style={{ color: "var(--text-muted)" }}>{mood.blurb}</p>

        <div className="mt-10 space-y-3">
          {resolved.map((p, i) => (
            <article key={i} className="glass rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-lg">{p.q}</span>
                <span className="text-xl shrink-0" aria-hidden>{open === i ? "−" : "+"}</span>
              </button>
              {open === i && p.dramas.length > 0 && (
                <div className="px-5 pb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {p.dramas.map((d) => <DramaCard key={d.slug} drama={d} compact />)}
                </div>
              )}
              {open === i && p.dramas.length === 0 && (
                <div className="px-5 pb-6 text-sm" style={{ color: "var(--text-muted)" }}>
                  These dramas aren't in our curated catalogue yet — they will be added as the archive grows.
                </div>
              )}
            </article>
          ))}
        </div>

        <p className="mt-10 text-xs" style={{ color: "var(--text-muted)" }}>
          Picks are editorial, not algorithmic. If you disagree, you're probably right — and that's the point.
        </p>
      </div>
    </section>
  );
}
