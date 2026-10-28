// Pure status derivation for a TV/streaming show.
// Uses Asia/Seoul (KST) for "today" per D-005.

export type DramaStatus =
  | "upcoming"   // premiere date in the future / "To Be Determined" with no past airdates
  | "airing"     // currently in progress (status === "Running" OR upcoming episodes after today)
  | "ended";     // all episodes aired, status === "Ended"

export type ShowLike = {
  status?: string | null;          // TVMaze status ("Running" | "Ended" | "To Be Determined" | "In Development")
  premiered?: string | null;       // "YYYY-MM-DD"
  ended?: string | null;           // "YYYY-MM-DD"
  nextAirDate?: string | null;     // next episode airdate "YYYY-MM-DD" (if known)
  lastAirDate?: string | null;     // last aired episode airdate
};

const KST_OFFSET_MS = 9 * 60 * 60 * 1000; // UTC+9

/** Returns current wall-clock date in Asia/Seoul, truncated to midnight. */
export function todayInKST(now: Date = new Date()): Date {
  // Convert UTC ms to KST wall-clock ms, then truncate to start-of-day.
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  kstNow.setUTCHours(0, 0, 0, 0);
  return kstNow;
}

function parseDate(s?: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Derive a canonical status for the show.
 *
 * Rules (in order):
 *   - If TVMaze says "Ended" AND ended date is today or earlier → ended.
 *   - If TVMaze says "Running" OR next episode air date is after today → airing.
 *   - If there is no premiered date yet OR premiere is in the future → upcoming.
 *   - If premiere is in the past but no next episode AND status is not "Ended" → airing
 *     (covers shows that have started but may be on hiatus).
 *   - Otherwise ended.
 *
 * Boundaries are evaluated against midnight KST so a drama premiering "today" in
 * Seoul switches from upcoming to airing at KST midnight.
 */
export function deriveStatus(show: ShowLike, now: Date = new Date()): DramaStatus {
  const today = todayInKST(now);
  const premiered = parseDate(show.premiered);
  const ended = parseDate(show.ended);
  const nextAir = parseDate(show.nextAirDate);
  const lastAir = parseDate(show.lastAirDate);
  const status = (show.status || "").toLowerCase();

  if (status === "ended") return "ended";
  if (status === "running") return "airing";
  if (nextAir && nextAir.getTime() >= today.getTime()) return "airing";

  if (!premiered) {
    // "In Development" or no premiere known → upcoming
    if (status === "in development" || status === "to be determined") return "upcoming";
    return "upcoming";
  }
  if (premiered.getTime() > today.getTime()) return "upcoming";

  // Premiered, no future episode announced yet, last air date is in the future → airing
  if (lastAir && lastAir.getTime() > today.getTime()) return "airing";

  // Explicit ended date in the past → ended.
  if (ended && ended.getTime() <= today.getTime()) return "ended";

  // If it premiered in the past but we don't know ended/next, call it airing if recent (last year) else ended.
  const daysSincePremiere = (today.getTime() - premiered.getTime()) / 86400000;
  if (daysSincePremiere > 365 * 5) return "ended";
  return "airing";
}

export function statusLabel(s: DramaStatus): string {
  switch (s) {
    case "upcoming": return "Upcoming";
    case "airing":  return "Airing now";
    case "ended":   return "Ended";
  }
}

export function canDisplayRating(s: DramaStatus, rating: number | null | undefined): boolean {
  // Never show a numeric rating for upcoming/unreleased shows (D-003).
  if (s === "upcoming") return false;
  return typeof rating === "number" && rating > 0 && Number.isFinite(rating);
}
