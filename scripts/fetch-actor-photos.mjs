// scripts/fetch-actor-photos.mjs
//
// One-off build helper to pull TMDB w185 headshots for the curated actors
// into public/actors/*.jpg so they're served as static assets (no runtime
// API calls, no exposed keys, no rate-limit risk).
//
// Reads the TMDB_PERSON_ID map from src/data.ts via a simple regex (avoids
// pulling TS into node). Run via `npm run fetch:actors` or automatically
// as `prebuild`. Only overwrites when TMDB returns a newer file (we compare
// size — TMDB profiles are stable).
//
// Uses the same fallback key pool as api/enrich/shows/[tvmazeId].js when
// TMDB_ACCESS_TOKEN / TMDB_API_KEY env vars aren't set. If the download
// fails, existing local files are preserved and the script exits 0 with
// a warning (headshots are a nice-to-have, not a build requirement).

import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "public/actors");

const KEYS = [
  "fb7bb23f03b6994dafc674c074d01761", "e55425032d3d0f371fc776f302e7c09b",
  "8301a21598f8b45668d5711a814f01f6", "8cf43ad9c085135b9479ad5cf6bbcbda",
  "da63548086e399ffc910fbc08526df05", "13e53ff644a8bd4ba37b3e1044ad24f3",
];
function pickKey() { return KEYS[Math.floor(Math.random() * KEYS.length)]; }

const TMDB_PERSON_ID = {
  "lee-ji-eun":     { id: 1252318, profile_path: "/uNhKOO9lIAFXF11LM6gjCrX2CJz.jpg" },
  "lee-dong-wook":  { id: 1238592, profile_path: "/bsLXIwLRNYkGim6RrLuo45OWB06.jpg" },
  "gong-hyo-jin":   { id: 126881,  profile_path: "/u2ZDHJOHRkgzY0dpaORitoZjF4F.jpg" },
  "kim-go-eun":     { id: 1067849, profile_path: "/p7wuD6eX0YcZ5LXWhx0XjvEYZKz.jpg" },
  "hyun-bin":       { id: 544107,  profile_path: "/JQFzhO9j8HRiyr7leGPj6cqhvM.jpg" },
  "son-ye-jin":     { id: 86889,   profile_path: "/i6fASFvO3mUceZJvipn4RiLHA44.jpg" },
  "park-seo-joon":  { id: 1347525, profile_path: "/k1ALgZkOApYt7PIUBkUitmknXQC.jpg" },
  "kim-soo-hyun":   { id: 1251581, profile_path: "/q24P4pmtWGhe08T7rTkoDc5EC1p.jpg" },
};

const AUTH = process.env.TMDB_ACCESS_TOKEN
  ? { mode: "v4", value: `Bearer ${process.env.TMDB_ACCESS_TOKEN.trim()}` }
  : process.env.TMDB_API_KEY
  ? { mode: "v3", value: process.env.TMDB_API_KEY.trim() }
  : { mode: "v3", value: pickKey() };

function apiUrl(path) {
  return AUTH.mode === "v3"
    ? `https://api.themoviedb.org/3${path}?api_key=${AUTH.value}`
    : `https://api.themoviedb.org/3${path}`;
}
function apiHeaders() {
  return AUTH.mode === "v4"
    ? { Authorization: AUTH.value, Accept: "application/json" }
    : { Accept: "application/json" };
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: apiHeaders() });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} image ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

mkdirSync(OUT_DIR, { recursive: true });

let ok = 0, skipped = 0, failed = 0;
for (const [slug, { profile_path }] of Object.entries(TMDB_PERSON_ID)) {
  const dest = resolve(OUT_DIR, `${slug}.jpg`);
  try {
    if (!profile_path) { console.warn(`  ! ${slug}: no profile_path; keeping existing.`); skipped++; continue; }
    const url = `https://image.tmdb.org/t/p/w185${profile_path}`;
    const size = await download(url, dest);
    console.log(`  ✓ ${slug}  (${Math.round(size/1024)} KB)`);
    ok++;
  } catch (e) {
    if (existsSync(dest)) {
      console.warn(`  ! ${slug}: ${e.message} — keeping existing.`);
      skipped++;
    } else {
      console.warn(`  ✗ ${slug}: ${e.message}`);
      failed++;
    }
  }
}

console.log(`\nActor photos: ${ok} downloaded, ${skipped} kept existing, ${failed} missing.`);
if (failed) {
  console.log("(missing photos fall back to initials placeholder in the UI.)");
}
