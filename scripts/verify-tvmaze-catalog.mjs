#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const file = resolve(root, "src/generated/tvmaze-catalog.json");
const minimum = Number(process.env.MIN_TVMAZE_CATALOG_COUNT || 2000);
let catalog;
try { catalog = JSON.parse(readFileSync(file, "utf8")); }
catch (error) { console.error("TVMaze catalogue is missing or invalid JSON:", error.message); process.exit(1); }
const shows = catalog && catalog.shows, meta = catalog && catalog._meta, failures = [];
if (!meta || meta.source !== "tvmaze") failures.push("source is not TVMaze");
if (!Array.isArray(shows)) failures.push("shows is not an array");
if (!Number.isInteger(meta && meta.count)) failures.push("metadata count is missing");
if (Array.isArray(shows) && shows.length < minimum) failures.push("only " + shows.length + " shows; expected at least " + minimum);
if (Array.isArray(shows) && meta.count !== shows.length) failures.push("metadata count does not match show count");
if (Array.isArray(shows)) {
  const ids = new Set(), slugs = new Set();
  for (const show of shows) {
    if (!Number.isInteger(show.id) || !show.name || typeof show.name !== "string") failures.push("record has invalid id/name");
    if (!show.slug || !/^[a-z0-9-]+$/.test(show.slug)) failures.push("record has invalid slug for ID " + show.id);
    if (!Array.isArray(show.genres)) failures.push("record has invalid genres for ID " + show.id);
    if (ids.has(show.id)) failures.push("duplicate TVMaze ID " + show.id);
    if (slugs.has(show.slug)) failures.push("duplicate slug " + show.slug);
    ids.add(show.id); slugs.add(show.slug);
  }
}
if (failures.length) {
  console.error("TVMaze catalogue verification FAILED:");
  for (const failure of [...new Set(failures)].slice(0,50)) console.error(" - " + failure);
  process.exit(1);
}
console.log("TVMaze catalogue verified: " + shows.length + " unique shows; IDs and slugs unique; fetchedAt=" + (meta.fetchedAt || "unknown") + ".");
