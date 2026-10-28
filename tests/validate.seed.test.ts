/**
 * Build-time integrity checks for src/data.ts. Fail loudly BEFORE users
 * see a broken bundle — protects against a repeat of the TDZ outage.
 */
import { describe, it, expect } from "vitest";
import * as DATA from "@/data";
import { CATALOG, collections, genres, actors, SHELF_DEFS, PLACEHOLDER_MARKERS,
         SLUG_REDIRECTS, resolveSlug, bySlugs } from "@/data";

describe("data.ts module import", () => {
  it("imports without throwing (TDZ guard)", () => {
    expect(DATA).toBeDefined();
  });
});

describe("canonical catalogue", () => {
  it("contains at least 20 dramas", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(20);
  });

  it("every slug is unique", () => {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const d of CATALOG) {
      if (seen.has(d.slug)) dups.push(d.slug);
      seen.add(d.slug);
    }
    expect(dups).toEqual([]);
  });

  it("every Drama has required fields", () => {
    for (const d of CATALOG) {
      expect(d.slug, "slug").toMatch(/^[a-z0-9-]+$/);
      expect(d.title?.length, `title for ${d.slug}`).toBeGreaterThan(0);
      expect(d.year, `year for ${d.slug}`).toBeGreaterThan(1990);
      expect(Array.isArray(d.genres), `genres for ${d.slug}`).toBe(true);
      expect(d.blurb?.length, `blurb for ${d.slug}`).toBeGreaterThan(0);
      expect(d.art, `art for ${d.slug}`).toMatch(/^art-[a-h]$/);
      expect(d.rating, `rating for ${d.slug}`).toBeGreaterThanOrEqual(0);
      expect(d.rating, `rating for ${d.slug}`).toBeLessThanOrEqual(10);
    }
  });

  it("no entry contains placeholder markers", () => {
    const bad: string[] = [];
    for (const d of CATALOG) {
      const hay = `${d.title} ${d.blurb} ${d.tagline ?? ""}`.toLowerCase();
      for (const m of PLACEHOLDER_MARKERS) {
        if (hay.includes(m)) bad.push(`${d.slug}: "${m}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("no future-year / fabricated entries", () => {
    const thisYear = new Date().getFullYear();
    const bad = CATALOG.filter(d => d.year > thisYear);
    expect(bad.map(d => d.slug)).toEqual([]);
  });
});

describe("shelf references resolve", () => {
  it("every shelf slug resolves to a real Drama", () => {
    const missing: string[] = [];
    for (const s of SHELF_DEFS) {
      for (const slug of s.slugList) {
        if (!resolveSlug(slug)) missing.push(`${s.id}: ${slug}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("recentFallback resolves without undefined entries", () => {
    expect(DATA.recentFallback.length).toBeGreaterThan(0);
    expect(DATA.recentFallback.every(Boolean)).toBe(true);
  });

  it("shelves export has the expected ids", () => {
    expect(DATA.shelves.map(s => s.id).sort()).toEqual(
      ["trending","recent","romance","thriller","fantasy"].sort()
    );
  });

  it("no drama appears more than once per shelf", () => {
    for (const s of DATA.shelves) {
      const slugs = s.items.map(d => d.slug);
      const dup = slugs.filter((x, i) => slugs.indexOf(x) !== i);
      expect(dup, `duplicates in shelf ${s.id}`).toEqual([]);
    }
  });
});

describe("collections", () => {
  it("every collection slug resolves and has items", () => {
    for (const c of collections) {
      const items = bySlugs(c.slugs);
      expect(items.length, `collection ${c.slug} has items`).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(10);
    }
  });
});

describe("genres & actors", () => {
  it("genres have unique slugs & accents", () => {
    expect(new Set(genres.map(g => g.slug)).size).toBe(genres.length);
  });
  it("actors have unique slugs", () => {
    expect(new Set(actors.map(a => a.slug)).size).toBe(actors.length);
  });
});

describe("slug redirects", () => {
  it("all target slugs are either empty (removed) or resolve to a canonical drama", () => {
    const bad: string[] = [];
    for (const [from, to] of Object.entries(SLUG_REDIRECTS)) {
      if (to && !resolveSlug(to)) bad.push(`${from} -> ${to}`);
    }
    expect(bad).toEqual([]);
  });
});
