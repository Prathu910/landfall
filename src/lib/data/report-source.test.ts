import { describe, expect, it } from "vitest";
import { monthEnd, reportSource } from "./report-source";

describe("report source provenance", () => {
  it("dates a snapshot at the last day of its as-at month", () => {
    expect(monthEnd("2026-10")).toBe("2026-10-31");
    expect(monthEnd("2026-11")).toBe("2026-11-30");
    expect(monthEnd("2028-02")).toBe("2028-02-29");
    expect(monthEnd("2027-02")).toBe("2027-02-28");
  });

  it("takes the snapshot date from the occupation as-at and the checked date and links from the manifest", () => {
    expect(
      reportSource("2026-10", {
        checkedAt: "2026-11-17",
        sources: {
          dashboard: "https://example.test/dashboard",
          currentRounds: "https://example.test/rounds",
          previousRounds: "https://example.test/previous",
        },
      }),
    ).toEqual({
      snapshotDate: "2026-10-31",
      checkedAt: "2026-11-17",
      dashboardUrl: "https://example.test/dashboard",
      roundsUrl: "https://example.test/rounds",
      previousRoundsUrl: "https://example.test/previous",
    });
  });
});
