/**
 * Forbidden-source guard. We never fetch/proxy/hotlink MyDramaList
 * (no public API; unofficial clients scrape). Only outbound
 * mydramalist.com/search?q= links are permitted.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname ?? process.cwd(), "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  const { readdirSync, statSync } = require("node:fs");
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const FILES = walk(resolve(ROOT, "src")).concat(walk(resolve(ROOT, "scripts")));

const FORBIDDEN = [
  /fetch\s*\(\s*['"]https?:\/\/[^'"]*mydramalist\.com/,
  /https?:\/\/[^'"\s)]*(?:image|cdn|static|img)\.mydramalist\.com/,
  /mydramalist\.com\/(?!search\?q=)/,
];

describe("forbidden sources: MyDramaList", () => {
  for (const file of FILES) {
    const rel = file.replace(ROOT + "/", "");
    it(`${rel} contains no forbidden MyDramaList usage`, () => {
      const src = existsSync(file) ? readFileSync(file, "utf8") : "";
      const hits: string[] = [];
      for (const re of FORBIDDEN) {
        if (re.test(src)) hits.push(re.toString());
      }
      expect(hits, `forbidden patterns in ${rel}`).toEqual([]);
    });
  }
});
