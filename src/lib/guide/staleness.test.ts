import { describe, expect, it } from "vitest";
import { FEES } from "../../data/guide/fees";
import { GUIDE_STEPS } from "../../data/guide/steps";
import { POINTS_CHANGES } from "../../data/guide/points-changes";
import { VISA_GUIDES } from "../../data/guide/visas";
import {
  chargesOutdated,
  feeItems,
  guideDatedItems,
  nextChargeChange,
  staleGuideItems,
} from "./staleness";

describe("staleGuideItems", () => {
  const items = [
    { id: "fresh", checkedAt: "2026-11-23", source: "https://a.gov.au" },
    { id: "year", checkedAt: "2025-11-23", source: "https://a.gov.au" },
    { id: "old", checkedAt: "2025-11-22", source: "https://a.gov.au" },
  ];
  it("lists items checked more than 12 months (365 days) before the date", () => {
    expect(staleGuideItems(items, "2026-11-23").map((i) => i.id)).toEqual([
      "old",
    ]);
  });
  it("treats an unreadable date as stale", () => {
    expect(
      staleGuideItems(
        [{ id: "bad", checkedAt: "23/11/2026", source: "https://a.gov.au" }],
        "2026-11-23",
      ),
    ).toHaveLength(1);
  });
});

describe("visa charge changes", () => {
  it("finds the next 1 July after the date the charges took effect", () => {
    expect(nextChargeChange("2026-07-01")).toBe("2027-07-01");
    expect(nextChargeChange("2026-06-30")).toBe("2026-07-01");
    expect(nextChargeChange("2026-12-31")).toBe("2027-07-01");
    expect(nextChargeChange("2027-01-01")).toBe("2027-07-01");
  });
  it("treats an unreadable date as having no known next change", () => {
    expect(nextChargeChange("1 Jul 2026")).toBeNull();
  });
  it("flags the charges from that 1 July, not before", () => {
    expect(chargesOutdated("2026-07-01", "2027-06-30")).toBe(false);
    expect(chargesOutdated("2026-07-01", "2027-07-01")).toBe(true);
    expect(chargesOutdated("2026-07-01", "2028-01-15")).toBe(true);
  });
  it("flags unreadable dates rather than passing them as current", () => {
    expect(chargesOutdated("2026/07/01", "2026-11-23")).toBe(true);
    expect(chargesOutdated("2026-07-01", "")).toBe(true);
  });
  it("leaves the checked-in charges current on the day they were checked", () => {
    expect(chargesOutdated(FEES.feesAsAt, "2026-11-23")).toBe(false);
  });
});

describe("guide data provenance", () => {
  const all = guideDatedItems({
    fees: FEES,
    steps: GUIDE_STEPS,
    pointsChanges: POINTS_CHANGES,
    visas: VISA_GUIDES,
  });

  it("collects every fee, including each visa's charges", () => {
    const ids = feeItems(FEES).map((i) => i.id);
    expect(ids).toContain("vac-189-main");
    expect(ids).toContain("vac-491-second");
    expect(ids).toContain("nom-qld");
    expect(ids).toContain("acs");
  });

  it("gives every item an https source and a calendar checked date", () => {
    expect(all.length).toBeGreaterThan(40);
    for (const item of all) {
      expect(item.source, item.id).toMatch(/^https:\/\//);
      expect(item.checkedAt, item.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("is fresh against the date it was checked (the build warns after 12 months)", () => {
    expect(staleGuideItems(all, "2026-11-23")).toEqual([]);
  });
});
