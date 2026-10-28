import { describe, expect, it } from "vitest";
import { deriveStatus, canDisplayRating, type DramaStatus } from "./status";

function at(dateStr: string): Date {
  // Parse as KST midnight for deterministic "now"
  const [y, m, d] = dateStr.split("-").map(Number);
  // Build UTC date corresponding to KST midnight: UTC = KST - 9h
  return new Date(Date.UTC(y, m - 1, d - 1, 15, 0, 0));
}

describe("deriveStatus", () => {
  it("returns 'ended' for Ended show with past ended date", () => {
    expect(deriveStatus({ status: "Ended", premiered: "2018-03-21", ended: "2018-05-17" }, at("2025-01-01"))).toBe("ended");
  });

  it("returns 'airing' when status Running regardless of dates", () => {
    expect(deriveStatus({ status: "Running", premiered: "2024-01-01" }, at("2025-01-01"))).toBe("airing");
  });

  it("returns 'upcoming' when premiere is in the future (KST boundary)", () => {
    // Premiere is "2026-11-01" → upcoming on 2026-10-31 KST
    expect(deriveStatus({ status: "To Be Determined", premiered: "2026-11-01" }, at("2026-10-31"))).toBe("upcoming");
    // Premiere day itself (KST midnight crosses)
    expect(deriveStatus({ status: "Running", premiered: "2026-11-01" }, at("2026-11-01"))).toBe("airing");
  });

  it("returns 'upcoming' for In Development without a premiere", () => {
    expect(deriveStatus({ status: "In Development" }, at("2026-10-28"))).toBe("upcoming");
    expect(deriveStatus({ status: "To Be Determined" }, at("2026-10-28"))).toBe("upcoming");
  });

  it("returns 'airing' if next episode is in the future", () => {
    expect(deriveStatus({ status: "", premiered: "2026-09-01", nextAirDate: "2026-11-05" }, at("2026-10-28"))).toBe("airing");
  });

  it("considers old premiered + no ended date + not recent as ended", () => {
    // A drama premiered >5 years ago with no running signal → ended
    expect(deriveStatus({ status: "", premiered: "2016-01-01" }, at("2026-10-28"))).toBe("ended");
  });
});

describe("canDisplayRating", () => {
  it("hides rating for upcoming shows even if a number is present", () => {
    expect(canDisplayRating("upcoming", 9.4)).toBe(false);
  });
  it("shows rating for airing/ended shows when rating >0", () => {
    expect(canDisplayRating("airing", 8.5)).toBe(true);
    expect(canDisplayRating("ended", 7.9)).toBe(true);
  });
  it("hides rating when null/0/undefined", () => {
    expect(canDisplayRating("ended", 0)).toBe(false);
    expect(canDisplayRating("airing", null)).toBe(false);
    expect(canDisplayRating("ended", undefined)).toBe(false);
  });
});
