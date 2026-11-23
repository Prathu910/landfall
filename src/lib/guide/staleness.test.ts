import { describe, expect, it } from "vitest";
import { FEES } from "../../data/guide/fees";
import { GUIDE_STEPS } from "../../data/guide/steps";
import { POINTS_CHANGES } from "../../data/guide/points-changes";
import { VISA_GUIDES } from "../../data/guide/visas";
import { feeItems, guideDatedItems, staleGuideItems } from "./staleness";

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
