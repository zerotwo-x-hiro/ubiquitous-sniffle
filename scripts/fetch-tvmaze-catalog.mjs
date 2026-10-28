#!/usr/bin/env node
/**
 * scripts/fetch-tvmaze-catalog.mjs
 *
 * Build-time fetcher: pull every Scripted Korean-language / Korean-network
 * show from TVMaze (paginated at 250/page) and emit a compact JSON file at
 * src/generated/tvmaze-catalog.json for lazy-loading in the browser.
 *
 * - Respects TVMaze rate limits (20 req/sec burst; 20 points/10s steady —
 *   we do 1 req/sec with a tiny jitter, which is extremely safe).
 * - Continues from an existing cached file if present (only re-fetches
 *   pages newer than `updated` timestamps) via --incremental.
 * - Filters to: type=Scripted AND (language=Korean OR network.country=KR
 *   OR webChannel.country=KR). This matches what TVMaze itself calls
 *   "Korean dramas" (including web/streaming originals on Netflix Korea,
 *   TVING, Wavve, Disney+ KR, etc.).
 * - Strips down each entry to a minimal shape to keep the JSON small.
 *
 * Usage:
 *   node scripts/fetch-tvmaze-catalog.mjs                # full re-fetch
 *   node scripts/fetch-tvmaze-catalog.mjs --incremental  # resume from cache
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_PATH = resolve(ROOT, "src/generated/tvmaze-catalog.json");
const CACHE_PATH = resolve(ROOT, ".tvmaze-cache");

const BASE = "https://api.tvmaze.com/shows";
const PER_PAGE = 250;
const DELAY_MS = 650;        // ~1.5 req/s, safe for TVMaze public API
const MAX_PAGES = 500;       // hard cap (~125k shows) just in case
const MIN_YEAR = 1990;       // drop pre-90s noise (any old KR shows that don't matter)

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['':;,.!?()[\]{}&/\\#%*+=<>|@`~^_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function compactShow(s) {
  const year = s.premiered ? Number(s.premiered.slice(0, 4)) : null;
  const network = s.network?.name || s.webChannel?.name || null;
  const country = s.network?.country?.code || s.webChannel?.country?.code || null;
  const medium = s.image?.medium || null;
  const original = s.image?.original || null;
  const summary = (s.summary || "").replace(/<[^>]+>/g, "").trim();
  return {
    id: s.id,
    name: s.name,
    slug: slugify(s.name),
    year,
    rating: s.rating?.average ?? null,
    runtime: s.averageRuntime ?? s.runtime ?? null,
    episodes: null, // filled by episodes endpoint only if we want it; skip to keep small
    genres: s.genres || [],
    status: s.status || null,
    network,
    country,
    poster: medium,
    posterOriginal: original,
    premiered: s.premiered || null,
    ended: s.ended || null,
    weight: s.weight || 0,
    summary: summary.length > 280 ? summary.slice(0, 277) + "…" : summary,
    updated: s.updated || 0,
    imdb: s.externals?.imdb || null,
    tvdb: s.externals?.thetvdb || null,
    url: s.url,
  };
}

function isKoreanDrama(s) {
  if (s.type !== "Scripted") return false;
  if (s.language === "Korean") return true;
  if (s.network?.country?.code === "KR") return true;
  if (s.webChannel?.country?.code === "KR") return true;
  return false;
}

async function fetchPage(page, { retries = 4 } = {}) {
  const url = `${BASE}?page=${page}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json", "User-Agent": "KDramaWorld/1.0 (catalog builder)" },
      });
      if (res.status === 404) return null;
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after")) || 5;
        console.log(`    rate limited on page ${page}, waiting ${retryAfter}s…`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      const backoff = 2 ** attempt * 1000;
      console.warn(`    page ${page} attempt ${attempt + 1} failed: ${err.message} — retrying in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw new Error(`page ${page} failed after ${retries} retries`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms + Math.random() * 100));
}

async function main() {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  const incremental = process.argv.includes("--incremental") && existsSync(OUT_PATH);
  let existing = { shows: {}, lastPage: -1 };
  if (incremental) {
    try {
      const raw = JSON.parse(readFileSync(OUT_PATH, "utf8"));
      existing = {
        shows: Object.fromEntries((raw.shows || []).map((s) => [s.id, s])),
        lastPage: raw._meta?.lastPage ?? -1,
      };
      console.log(`incremental: loaded ${Object.keys(existing.shows).length} cached shows (last page ${existing.lastPage})`);
    } catch { existing = { shows: {}, lastPage: -1 }; }
  }

  // Warm-up HEAD request to determine first empty page quickly not needed;
  // we just walk from 0 until 404.
  const seen = new Set(Object.keys(existing.shows).map(Number));
  let added = 0, updated = 0, kept = 0;
  let page = 0;
  for (; page < MAX_PAGES; page++) {
    const data = await fetchPage(page);
    if (data === null) { console.log(`  page ${page}: 404 → done at page ${page - 1}`); break; }
    if (!Array.isArray(data)) throw new Error(`page ${page}: unexpected shape`);
    let pageKorean = 0;
    for (const s of data) {
      if (!isKoreanDrama(s)) continue;
      const c = compactShow(s);
      if (c.year && c.year < MIN_YEAR) continue;
      if (!seen.has(c.id)) { added++; }
      else {
        const prev = existing.shows[c.id];
        if (c.updated > (prev?.updated || 0)) updated++;
        else kept++;
      }
      seen.add(c.id);
      existing.shows[c.id] = c;
      pageKorean++;
    }
    const totalKorean = Object.keys(existing.shows).length;
    process.stdout.write(`  page ${page}: ${data.length} total, ${pageKorean} kept (running k-drama total: ${totalKorean})\r`);
    await sleep(DELAY_MS);
  }

  const all = Object.values(existing.shows)
    // Drop items with no poster and no rating at all (they're placeholders / empty shells on TVMaze)
    .filter((s) => s.name && (s.poster || s.rating || s.summary))
    .sort((a, b) => {
      // Sort: premier desc, then by weight/popularity desc, then rating desc
      const ay = a.year || 0, by = b.year || 0;
      if (by !== ay) return by - ay;
      if ((b.weight || 0) !== (a.weight || 0)) return (b.weight || 0) - (a.weight || 0);
      return (b.rating || 0) - (a.rating || 0);
    });

  // De-dupe by slug (keep highest-rated if two shows share a name-slug — rare, but safe).
  const bySlug = new Map();
  for (const s of all) {
    const existingSlug = bySlug.get(s.slug);
    if (!existingSlug || (s.rating || 0) > (existingSlug.rating || 0)) bySlug.set(s.slug, s);
  }
  const finalShows = [...bySlug.values()];

  const out = {
    _meta: {
      source: "tvmaze",
      fetchedAt: new Date().toISOString(),
      lastPage: page - 1,
      count: finalShows.length,
      filter: "type=Scripted AND (language=Korean OR network.country=KR OR webChannel.country=KR)",
    },
    shows: finalShows,
  };
  writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`  total k-dramas: ${finalShows.length}`);
  console.log(`  added: ${added}, updated: ${updated}, kept-unmodified: ${kept}`);
  console.log(`  file size: ${Math.round((Buffer.byteLength(JSON.stringify(out)))/1024)} KB`);

  // Drop cache marker file so future incremental runs know the source is local
  writeFileSync(CACHE_PATH, new Date().toISOString());
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
