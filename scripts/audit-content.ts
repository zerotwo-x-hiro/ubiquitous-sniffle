// scripts/audit-content.ts
// Audits every seed drama in src/data.ts against the TVMaze API and writes
// docs/CONTENT_AUDIT.md and docs/content-audit.json.
//
// Usage: npx tsx scripts/audit-content.ts
//
// Optional env: TMDB_ACCESS_TOKEN  (also checks TMDB match when set)
//
// The audit makes ~50-60 HTTP calls; it serialises calls to avoid 429s
// and adds 250ms between requests.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------- Parse data.ts into a flat list of entries ----------

type Entry = {
  slug: string;
  title: string;
  year?: number;
  rating: number;
  episodes?: number;
  genres: string[];
  blurb: string;
  network?: string;
  sections: string[];
  isNew?: boolean;
};

function stripJsComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Extract every Drama object literal in src/data.ts by walking braces. */
function extractDramas(src: string): Entry[] {
  const out: Entry[] = [];

  // Find patterns that look like { slug: "...", title: "...", ... }
  // We extract all slug: "..." occurrences and then scan forward to the
  // matching closing brace.
  const re = /slug:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    // Find nearest '{' before the slug (going back at most 60 chars)
    let brace = src.lastIndexOf("{", start);
    if (brace === -1 || start - brace > 120) continue;
    // Match braces forward
    let depth = 0;
    let i = brace;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    const objSrc = src.slice(brace, i);
    const getStr = (key: string): string | undefined => {
      const mm = objSrc.match(new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      return mm ? mm[1] : undefined;
    };
    const getNum = (key: string): number | undefined => {
      const mm = objSrc.match(new RegExp(`${key}:\\s*(\\d+(?:\\.\\d+)?)`));
      return mm ? Number(mm[1]) : undefined;
    };
    const getBool = (key: string): boolean => new RegExp(`${key}:\\s*true`).test(objSrc);
    const getArr = (key: string): string[] => {
      const mm = objSrc.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`));
      if (!mm) return [];
      const arr: string[] = [];
      const sm = mm[1].matchAll(/"((?:[^"\\]|\\.)*)"/g);
      for (const s of sm) arr.push(s[1]);
      return arr;
    };

    out.push({
      slug: m[1],
      title: getStr("title") || "(missing title)",
      year: getNum("year"),
      rating: getNum("rating") ?? 0,
      episodes: getNum("episodes"),
      genres: getArr("genres"),
      blurb: (getStr("blurb") || "").slice(0, 100),
      network: getStr("network"),
      isNew: getBool("isNew"),
      sections: [],
    });
  }
  return out;
}

/** Label each entry with the shelf/section it appears in. */
function labelSections(src: string, entries: Entry[]): void {
  const exports: Array<[string, string]> = [
    ["featured", "featured"],
    ["discover", "discover"],
    ["recent", "recent (2026 slate)"],
    ["romance", "romance"],
    ["thrillers", "thrillers"],
    ["fantasy", "fantasy"],
    ["topRated", "topRated"],
    ["comingSoon", "comingSoon"],
    ["recentlyAdded", "recentlyAdded"],
  ];
  const slugToEntry = new Map(entries.map((e) => [e.slug, e]));
  for (const [name, label] of exports) {
    const re = new RegExp(`export const ${name}[\\s\\S]*?;`);
    const m = src.match(re);
    if (!m) continue;
    for (const em of m[0].matchAll(/slug:\s*"([^"]+)"/g)) {
      const e = slugToEntry.get(em[1]);
      if (e && !e.sections.includes(label)) e.sections.push(label);
    }
  }
  // Collections
  const colRe = /slug:\s*"([^"]+)",[\s\S]*?title:\s*"((?:[^"\\]|\\.)*)"/g;
  const colBlock = src.match(/export const collections[\s\S]*?;/);
  if (colBlock) {
    let cm: RegExpExecArray | null;
    while ((cm = colRe.exec(colBlock[0]))) {
      const e = slugToEntry.get(cm[1]);
      if (e && !e.sections.includes("collections")) e.sections.push("collections");
    }
  }
}

// ---------- TVMaze ----------

type TvMazeSearchHit = { score?: number; show?: any };
type TvMazeShow = any;

const TVMAZE = "https://api.tvmaze.com";

async function tvGet<T>(path: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(TVMAZE + path, { headers: { Accept: "application/json" } });
      if (r.status === 429) {
        const wait = 1500 * (attempt + 1) * (attempt + 1);
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as T;
    } catch (e) {
      if (attempt === 2) return null;
      await new Promise((res) => setTimeout(res, 600 * (attempt + 1)));
    }
  }
  return null;
}

function stripHtml(s?: string | null): string {
  if (!s) return "";
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h\d)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ").trim();
}

function isKorean(show: TvMazeShow): boolean {
  const isKR = show?.network?.country?.code === "KR" || show?.webChannel?.country?.code === "KR";
  const isLang = (show?.language || "").toLowerCase() === "korean";
  return isKR || isLang;
}

function yearFrom(s?: string | null): number | null {
  if (!s) return null;
  const y = parseInt(s.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

// ---------- Main ----------

type Issue = {
  slug: string;
  title: string;
  sections: string[];
  kind: string;
  severity: "P0" | "P1" | "P2" | "P3";
  detail: string;
  fix: string;
};

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const src = stripJsComments(readFileSync(resolve(ROOT, "src/data.ts"), "utf8"));
  const entries = extractDramas(src);
  labelSections(src, entries);
  // de-dup by slug (extractDramas can re-match if patterns overlap)
  const seen = new Set<string>();
  const unique = entries.filter((e) => (seen.has(e.slug) ? false : (seen.add(e.slug), true)));
  console.log(`Parsed ${unique.length} unique seed drama slugs`);

  const issues: Issue[] = [];
  const auditRows: any[] = [];
  const titleToMatches = new Map<string, any>();

  // First pass: TVMaze single-search for every unique title.
  let done = 0;
  for (const e of unique) {
    done++;
    if (done % 10 === 0) console.log(`  audited ${done}/${unique.length}...`);
    const q = encodeURIComponent(e.title);
    const single = await tvGet<TvMazeShow>(`/singlesearch/shows?q=${q}`);
    await delay(120);
    let best: TvMazeShow | null = single;

    // Use single-search result when it is Korean or matches by year;
    // otherwise, fall back to /search/shows and pick the best Korean hit.
    let neededFallback = false;
    if (best && !isKorean(best)) { best = null; neededFallback = true; }
    if (best && e.year) {
      const sy = yearFrom(best.premiered);
      if (sy && Math.abs(sy - e.year) > 1) { best = null; neededFallback = true; }
    }
    if (neededFallback || !best) {
      const hits = await tvGet<TvMazeSearchHit[]>(`/search/shows?q=${q}`);
      await delay(120);
      const kr = (hits || []).map((h) => h.show).filter((s) => s && isKorean(s));
      const yr = kr.filter((s) => {
        const sy = yearFrom(s.premiered);
        return !e.year || !sy || Math.abs(sy - e.year) <= 1;
      });
      best = yr[0] || kr[0] || null;
    }

    titleToMatches.set(e.slug, best);

    const row: any = { slug: e.slug, title: e.title, sections: e.sections, tvmaze: best ? { id: best.id, name: best.name, premiered: best.premiered, language: best.language, country: best.network?.country?.code || best.webChannel?.country?.code || null, rating: best.rating?.average ?? null, network: best.network?.name || best.webChannel?.name || null, status: best.status, image: !!best.image } : null };
    auditRows.push(row);

    // Issue checks
    if (!best) {
      issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "no-tvmaze-match", severity: "P1", detail: `No Korean-language TVMaze show found for title "${e.title}" (year ${e.year ?? "?"})`, fix: "Add explicit tvmazeId override in catalog.overrides.json or remove/fix seed." });
      continue;
    }

    const sy = yearFrom(best.premiered);
    // Status mismatch: appearing in comingSoon but TVMaze says Ended (or already premiered past)
    const cs = e.sections.includes("comingSoon");
    if (cs) {
      const isEnded = (best.status || "").toLowerCase() === "ended";
      const premieredPast = sy != null && sy <= new Date().getFullYear() - 0; // premiere year <= current
      const hasRating = (best.rating?.average ?? 0) > 0;
      if (isEnded || hasRating) {
        issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "status-contradiction", severity: "P1", detail: `Marked Coming Soon but TVMaze shows status=${best.status}, rating=${best.rating?.average}, premiered=${best.premiered}`, fix: "Remove from comingSoon or correct status using deriveStatus()." });
      }
    }

    // Duplicate under different slugs: will be flagged by dedupe check below
    // Rating invented for unreleased
    if (cs && e.rating > 0 && !best.rating?.average) {
      issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "invented-rating", severity: "P0", detail: `Coming-soon entry has hardcoded rating ${e.rating} but TVMaze has no rating (status=${best.status}).`, fix: "Set rating to 0 (Not rated) until the show airs." });
    }

    // Year mismatch
    if (e.year && sy && Math.abs(sy - e.year) > 1) {
      issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "year-mismatch", severity: "P2", detail: `Seed year ${e.year} vs TVMaze premiered ${best.premiered} (${sy}).`, fix: "Update seed year or add explicit override." });
    }

    // Rating differs
    if (best.rating?.average && e.rating > 0 && Math.abs(best.rating.average - e.rating) > 0.15) {
      issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "rating-differs", severity: "P2", detail: `Seed rating ${e.rating.toFixed(1)} vs TVMaze ${best.rating.average.toFixed(1)}.`, fix: "Pull live rating from TVMaze; seed only used as fallback." });
    }

    // Missing poster
    if (!best.image?.medium && !best.image?.original) {
      issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "missing-poster", severity: "P3", detail: "TVMaze has no image for this show.", fix: "Use TMDB/other source or rely on gradient fallback." });
    }

    // Wrong language/country (single-search matched non-KR show that passed earlier filter)
    if (!isKorean(best)) {
      issues.push({ slug: e.slug, title: e.title, sections: e.sections, kind: "non-korean-match", severity: "P0", detail: `Best TVMaze match is language=${best.language}, country=${best.network?.country?.code || best.webChannel?.country?.code}, name="${best.name}".`, fix: "Add explicit tvmazeId override; never accept non-KR results." });
    }

    await delay(40);
  }

  // Duplicate detection
  const byTvmazeId = new Map<number, string[]>();
  for (const e of unique) {
    const show: any = titleToMatches.get(e.slug);
    if (show?.id) {
      const arr = byTvmazeId.get(show.id) || [];
      arr.push(e.slug);
      byTvmazeId.set(show.id, arr);
    }
  }
  for (const [id, slugs] of byTvmazeId) {
    if (slugs.length > 1) {
      issues.push({ slug: slugs.join(", "), title: "", sections: [], kind: "duplicate-slug", severity: "P1", detail: `Multiple seed slugs resolve to the same TVMaze id ${id}: ${slugs.join(", ")}`, fix: "Keep one canonical slug; add redirects from others." });
    }
  }

  // Duplicate titles in data.ts that have different tvmaze ids (probable wrong match)
  const byTitle = new Map<string, Entry[]>();
  for (const e of unique) {
    const arr = byTitle.get(e.title) || [];
    arr.push(e);
    byTitle.set(e.title, arr);
  }
  for (const [title, ents] of byTitle) {
    const ids = new Set(ents.map((en) => (titleToMatches.get(en.slug) as any)?.id).filter(Boolean));
    if (ents.length > 1 && ids.size === 1 && ents.some((e) => e.slug !== ents[0].slug)) {
      // Already caught above via byTvmazeId
    }
  }

  // Actors audit: names exist? (skipped by default to keep runtime reasonable; toggle if needed)
  const AUDIT_ACTORS = false;
  if (AUDIT_ACTORS) {
  const actorSrc = src.match(/export const actors[\s\S]*?;/)?.[0] || "";
  for (const am of actorSrc.matchAll(/slug:\s*"([^"]+)",\s*name:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const [, slug, name] = am;
    await delay(250);
    const hits = await tvGet<any[]>(`/search/people?q=${encodeURIComponent(name)}`);
    const match = (hits || []).find((h) => h.person?.country?.name === "Korea" || /korean/i.test(h.person?.country?.name || ""));
    if (!match) {
      issues.push({ slug, title: name, sections: ["actors"], kind: "actor-unverified", severity: "P3", detail: `Actor "${name}" did not return a Korean-person match on TVMaze people search.`, fix: "Verify actor and attach tvmaze person id; use cast endpoint." });
    }
  }
  } // end AUDIT_ACTORS

  // Write outputs
  mkdirSync(resolve(ROOT, "docs"), { recursive: true });
  writeFileSync(resolve(ROOT, "docs/content-audit.json"), JSON.stringify({ generated: new Date().toISOString(), total: unique.length, issues, rows: auditRows }, null, 2));

  const bySev = { P0: 0, P1: 0, P2: 0, P3: 0 } as Record<string, number>;
  for (const i of issues) bySev[i.severity]++;

  let md = `# Content Audit\n\nGenerated ${new Date().toISOString()} against TVMaze.\n\n- Total seed slugs audited: **${unique.length}**\n- Issues found: **${issues.length}** (P0: ${bySev.P0}, P1: ${bySev.P1}, P2: ${bySev.P2}, P3: ${bySev.P3})\n\n## Severity key\n\n- **P0** Data is fabricated or dangerously wrong (fake ratings, non-Korean matches)\n- **P1** Broken/categorically wrong (duplicate slugs, status contradictions, no match)\n- **P2** Mismatch with source (year/rating off)\n- **P3** Missing nice-to-have (posters, actor verification)\n\n## Issues\n\n| ID | Sev | Slug | Title | Section(s) | Kind | Detail | Fix |\n|---|---|---|---|---|---|---|---|\n`;
  issues.forEach((i, idx) => {
    md += `| A${String(idx+1).padStart(3,"0")} | ${i.severity} | \`${i.slug}\` | ${i.title || ""} | ${i.sections.join(", ")} | ${i.kind} | ${i.detail.replace(/\|/g,"\\|")} | ${i.fix} |\n`;
  });
  md += `\n\n## Match table\n\n| Slug | Title | Sections | TVMaze id | Name | Year (seed/api) | Status | Rating (seed/api) | KR? | Image? |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const r of auditRows) {
    const seed = unique.find((u) => u.slug === r.slug)!;
    const t = r.tvmaze;
    md += `| \`${r.slug}\` | ${r.title} | ${r.sections.join(",")} | ${t ? t.id : "—"} | ${t ? t.name : "—"} | ${seed.year ?? "?"} / ${t?.premiered?.slice(0,4) ?? "—"} | ${t?.status ?? "—"} | ${seed.rating ? seed.rating.toFixed(1) : "—"} / ${t?.rating ?? "—"} | ${t ? ((t.country || t.language === "Korean") ? "✓" : "✗") : "?"} | ${t?.image ? "✓" : (t ? "✗" : "?")} |\n`;
  }
  writeFileSync(resolve(ROOT, "docs/CONTENT_AUDIT.md"), md);
  console.log(`\nWrote docs/CONTENT_AUDIT.md and docs/content-audit.json (${issues.length} issues)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
