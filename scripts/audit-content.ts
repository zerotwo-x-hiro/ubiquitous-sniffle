#!/usr/bin/env npx tsx
/**
 * scripts/audit-content.ts
 *
 * Content audit: walk every curated drama seed, call TVMaze through the
 * same validator pipeline the app uses, and report:
 *  - slug / title / year / genres / network
 *  - TVMaze match (or fallback to seed)
 *  - any mismatches between seed and TVMaze (year delta, genre drift, missing network)
 *  - any non-KR results that were rejected (shows the validator caught)
 *  - rating / poster / summary presence
 *
 * Usage:  npx tsx scripts/audit-content.ts            # audit all curated
 *         npx tsx scripts/audit-content.ts goblin     # audit one slug
 *         npx tsx scripts/audit-content.ts --json     # machine-readable JSON
 */
import { CATALOG, type Drama } from "../src/data";
import { fetchDramaByTitle, getRecentCached, type EnrichedDrama } from "../src/api";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const onlySlug = args.find((a) => !a.startsWith("--"));

type Entry = {
  slug: string;
  seedTitle: string;
  seedYear: number;
  matchTitle: string;
  matchYear: number;
  matchNetwork: string | undefined;
  matchRating: number;
  matchGenres: string[];
  poster: boolean;
  backdrop: boolean;
  imdb: boolean;
  summaryLen: number;
  issues: string[];
  enriched: boolean; // false = fell back to curated seed
};

function scoreSeed(d: Drama, e: EnrichedDrama): Entry {
  const issues: string[] = [];
  const hadError = !!e.fetchError;
  // A real TVMaze enrichment adds a tvmazeId (and usually a poster/network).
  // If the result has no tvmazeId and no poster, it's fallback to seed data.
  const enriched = !hadError && !!(e.tvmazeId && (e.poster || (e.network && !/^art-[a-h]$/.test(e.art || ""))));
  if (hadError) issues.push(`fetch-error: ${e.fetchError}`);
  else if (!enriched) issues.push("no-tvmaze-match (used curated seed)");
  if (enriched && Math.abs(e.year - d.year) > 0) issues.push(`year-delta seed=${d.year} tvmaze=${e.year}`);
  if (enriched && e.network && /AMC|BBC|HBO|NHK|Smithsonian|Disney\+|Showtime|Netflix US|Hulu|Apple TV\+/i.test(e.network)) {
    issues.push(`suspicious-network: ${e.network}`);
  }
  if (enriched && (!e.rating || e.rating === 0)) issues.push("no-rating");
  if (!e.poster) issues.push("no-poster");
  if ((e.genres?.length ?? 0) === 0) issues.push("no-genres");
  if (e.blurb && e.blurb.length < 30) issues.push("short-blurb");
  return {
    slug: d.slug,
    seedTitle: d.title,
    seedYear: d.year,
    matchTitle: e.title,
    matchYear: e.year,
    matchNetwork: e.network,
    matchRating: e.rating ?? 0,
    matchGenres: e.genres ?? [],
    poster: !!e.poster,
    backdrop: !!e.backdrop,
    imdb: !!e.imdbId,
    summaryLen: (e.blurb || "").length,
    issues,
    enriched,
  };
}

async function main() {
  // Filter seed list
  const curated = onlySlug ? CATALOG.filter((d) => d.slug === onlySlug) : CATALOG;
  if (curated.length === 0) {
    console.error(`No drama matching slug "${onlySlug}"`);
    process.exit(1);
  }

  console.error(`Auditing ${curated.length} curated dramas against TVMaze...`);
  // Run in batches to be polite
  const BATCH = 6;
  const entries: Entry[] = [];
  for (let i = 0; i < curated.length; i += BATCH) {
    const batch = curated.slice(i, i + BATCH);
    const enriched = await Promise.all(batch.map((d) => fetchDramaByTitle(d)));
    for (const e of enriched) {
      const seed = curated.find((d) => d.slug === e.slug)!;
      entries.push(scoreSeed(seed, e));
    }
    console.error(`  ${Math.min(i + BATCH, curated.length)}/${curated.length}`);
  }

  // Also audit recent shelf
  const recent = await getRecentCached(12);
  const recentEntries: Entry[] = recent.map((e) => {
    const issues: string[] = [];
    if (!e.poster) issues.push("no-poster");
    if (!e.rating) issues.push("no-rating");
    return {
      slug: e.slug,
      seedTitle: e.title,
      seedYear: e.year,
      matchTitle: e.title,
      matchYear: e.year,
      matchNetwork: e.network,
      matchRating: e.rating ?? 0,
      matchGenres: e.genres ?? [],
      poster: !!e.poster,
      backdrop: !!e.backdrop,
      imdb: !!e.imdbId,
      summaryLen: (e.blurb || "").length,
      issues,
      enriched: true,
    };
  });

  // Summaries
  const withIssues = entries.filter((e) => e.issues.length > 0);
  const enrichedCount = entries.filter((e) => e.enriched).length;
  const unmatched = entries.filter((e) => !e.enriched);

  const summary = {
    generatedAt: new Date().toISOString(),
    curatedTotal: entries.length,
    curatedEnriched: enrichedCount,
    curatedFallback: unmatched.length,
    curatedWithIssues: withIssues.length,
    recentTotal: recentEntries.length,
    entries,
    recentEntries,
  };

  if (jsonOut) {
    const out = resolve(process.cwd(), "docs/content-audit.json");
    writeFileSync(out, JSON.stringify(summary, null, 2));
    console.log(`Wrote ${out}`);
    return;
  }

  // Human-readable
  console.log("\n=== CURATED DRAMAS ===\n");
  for (const e of entries) {
    const flag = e.issues.length ? ` ⚠  ${e.issues.join("; ")}` : "";
    console.log(
      `[${e.enriched ? "OK" : "--"}] ${e.slug.padEnd(30)} ${e.matchTitle.padEnd(32)} ${e.matchYear} · ${(e.matchNetwork || "—").padEnd(8)} ★${(e.matchRating || "—").toString().padEnd(4)} ${flag}`,
    );
  }
  console.log(`\n${enrichedCount}/${entries.length} enriched, ${unmatched.length} fallback, ${withIssues.length} with issues`);

  if (recentEntries.length) {
    console.log("\n=== RECENTLY AIRED ===\n");
    for (const e of recentEntries) {
      const flag = e.issues.length ? ` ⚠  ${e.issues.join("; ")}` : "";
      console.log(`[REC] ${e.slug.padEnd(30)} ${e.matchTitle.padEnd(32)} ${e.matchYear} · ${(e.matchNetwork || "—").padEnd(8)}${flag}`);
    }
  }

  // Write JSON too for docs/
  const out = resolve(process.cwd(), "docs/content-audit.json");
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log(`\nFull JSON: ${out}`);

  if (withIssues.some((e) => e.issues.some((i) => i.startsWith("suspicious-network")))) {
    console.error("\n❌ Suspicious networks still present — validator may be leaking.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
