import type { Drama } from "../data";
import { bySlugs, SHELF_DEFS, recentFallback } from "../data";

/**
 * Build shelf items for rendering. The "recent" shelf is live-fetched when
 * `liveRecent` is supplied; otherwise we fall back to curated recentFallback.
 */
export function buildShelfItems(liveRecent?: Drama[]): Array<{
  id: string; title: string; eyebrow?: string; items: Drama[]; live?: boolean;
}> {
  return SHELF_DEFS.map(s => ({
    id: s.id,
    title: s.title,
    eyebrow: s.eyebrow,
    live: !!s.live,
    items: s.live ? (liveRecent && liveRecent.length ? liveRecent : recentFallback) : bySlugs(s.slugList),
  }));
}
