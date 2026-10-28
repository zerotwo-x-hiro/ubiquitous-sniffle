import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DramaCard from "@/components/DramaCard";
import Collections from "@/components/Collections";
import { useLiveData } from "@/LiveData";
import { useAuth } from "@/Auth";
import { useSeo } from "@/lib/seo";
import type { AnyDrama } from "@/LiveData";

type Status = "want-to-watch" | "watching" | "completed" | "dropped";
const STATUSES: { key: Status; label: string }[] = [
  { key: "want-to-watch", label: "Want to Watch" },
  { key: "watching", label: "Watching" },
  { key: "completed", label: "Completed" },
  { key: "dropped", label: "Dropped" },
];

export default function ListsPage() {
  const { findBySlug } = useLiveData();
  const { user, watchlist, openAuthModal, profile } = useAuth();
  const [tab, setTab] = useState<Status | "all">("all");
  useSeo({ title: user ? "My List" : "Lists" });

  const items = useMemo(() => {
    const out: AnyDrama[] = [];
    for (const e of watchlist.values()) {
      if (tab !== "all" && e.status !== tab) continue;
      const d = findBySlug(e.drama_slug);
      if (d) out.push(d);
    }
    return out;
  }, [watchlist, tab, findBySlug]);

  if (!user) {
    return (
      <section className="relative z-10 px-[4%] py-16 md:py-24 max-w-xl mx-auto text-center">
        <h1 className="section-title text-4xl md:text-5xl mb-3">Your List</h1>
        <p className="mb-8" style={{ color: "var(--text-muted)" }}>
          Sign in to save dramas to your watchlist, track what you've watched, and build your own personal canon.
        </p>
        <button onClick={openAuthModal}
                className="btn-primary h-12 px-7 rounded-md font-bold text-[15px] inline-flex items-center gap-2"
                style={{ background: "#fff", color: "#000" }}>
          Sign in to get started
        </button>
        <div className="mt-16">
          <Collections />
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 px-[4%] py-10 md:py-14 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <div
          className="w-14 h-14 rounded-sm grid place-items-center text-xl font-black"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff" }}
        >
          {(profile?.display_name || profile?.username || user.email || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="section-title text-3xl md:text-4xl">My List</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {watchlist.size} {watchlist.size === 1 ? "drama" : "dramas"} saved
            {profile?.display_name ? ` · ${profile.display_name}` : user.email ? ` · ${user.email}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {([{ key: "all" as const, label: `All (${watchlist.size})` }, ...STATUSES.map(s => ({ key: s.key, label: `${s.label} (${[...watchlist.values()].filter(e=>e.status===s.key).length})` }))]).map(t => (
          <button key={t.key}
                  onClick={() => setTab(t.key)}
                  className="h-9 px-4 rounded-full text-sm font-semibold transition"
                  style={{
                    background: tab === t.key ? "var(--accent)" : "var(--chip-bg)",
                    color: tab === t.key ? "#fff" : "var(--text)",
                    border: "1px solid " + (tab === t.key ? "var(--accent)" : "var(--border-strong)"),
                  }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <div className="rounded-lg p-10 text-center"
               style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-muted)" }}>
              Nothing here yet. Hover any poster and tap the{" "}
              <span className="inline-flex w-6 h-6 rounded-full items-center justify-center align-middle mx-0.5"
                    style={{ background: "var(--accent)", color: "#fff" }}>+</span>{" "}
              to add it to your list, or{" "}
              <Link to="/explore" className="underline font-semibold" style={{ color: "var(--accent)" }}>browse dramas</Link>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {items.map(d => <DramaCard key={d.slug} drama={d} />)}
          </div>
        )}
      </div>
    </section>
  );
}
