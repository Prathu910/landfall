import { describe, expect, it } from "vitest";
import { isStale, staleRules } from "./staleness";
import type { StateRules } from "./rules-types";

describe("isStale", () => {
  it("is true beyond maxDays", () => {
    expect(isStale("2026-09-01", "2026-11-17")).toBe(true);
  });
  it("is false within maxDays and at the boundary", () => {
    expect(isStale("2026-10-01", "2026-11-17")).toBe(false);
    expect(isStale("2026-09-18", "2026-11-17")).toBe(false); // exactly 60
    expect(isStale("2026-09-17", "2026-11-17")).toBe(true); // 61
  });
});

describe("isStale edge cases", () => {
  it("fails closed on unparseable dates", () => {
    expect(isStale("not-a-date", "2026-11-17")).toBe(true);
    expect(isStale("2026-10-01", "")).toBe(true);
    expect(isStale("2026-13-01", "2026-11-17")).toBe(true);
  });
  it("counts days across a year boundary with a leap day", () => {
    expect(isStale("2027-12-31", "2028-03-01")).toBe(true); // 61 days
    expect(isStale("2028-01-01", "2028-03-01")).toBe(false); // 60 days
  });
});

const sv = <T>(value: T, checkedAt: string) => ({
  value,
  source: "https://example.gov.au",
  checkedAt,
  verification: "verified" as const,
});

describe("staleRules", () => {
  it("lists paths of rules more than 45 days old", () => {
    const rules: StateRules = {
      programYear: "2026-27",
      rules: [
        {
          state: "WA",
          visa: "190",
          selectionSystem: sv("x", "2026-11-10"),
          streams: [
            {
              id: "wa-general",
              name: "General",
              cohorts: sv(["offshore"], "2026-09-01"),
              status: sv("open", "2026-11-10"),
              occupations: sv({ kind: "none-published" }, "2026-11-10"),
              requirements: [
                sv({ kind: "job-offer-in-state" }, "2026-11-10"),
                sv({ kind: "lives-regional" }, "2026-08-01"),
              ],
            },
          ],
        },
      ],
    };
    expect(staleRules(rules, "2026-11-17")).toEqual([
      { path: "WA/190/wa-general/cohorts", checkedAt: "2026-09-01" },
      { path: "WA/190/wa-general/requirements/1", checkedAt: "2026-08-01" },
    ]);
  });
});
