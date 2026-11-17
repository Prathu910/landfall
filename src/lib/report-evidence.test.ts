import { describe, expect, it } from "vitest";
import {
  evidence,
  getOccupationEvidence,
  netPoolChange,
  validateOccupationEvidence,
} from "./report-evidence";
import { snapshot } from "./pool";

describe("published report evidence", () => {
  it("covers the imported occupations with twelve dated snapshots and six actual rounds", () => {
    expect(evidence.occupations.map((o) => o.code)).toEqual(
      snapshot.occupations.map((o) => o.code),
    );
    for (const occupation of evidence.occupations) {
      expect(occupation.trend).toHaveLength(12);
      expect(occupation.trend[0].date).toBe("2025-11-30");
      expect(occupation.trend.at(-1)?.date).toBe(evidence.snapshotDate);
      expect(occupation.rounds.map((r) => r.date)).toEqual([
        "2026-10-15",
        "2026-06-04",
        "2025-11-13",
        "2025-08-21",
        "2024-11-07",
        "2024-09-05",
      ]);
      expect(occupation.pathways.map((p) => p.visa)).toEqual([
        "189",
        "190",
        "491",
      ]);
      expect(validateOccupationEvidence(occupation)).toEqual([]);
      expect(occupation.pathways[0].points).toEqual(
        snapshot.occupations.find((o) => o.code === occupation.code)?.points,
      );
      expect(occupation.trend.at(-1)?.total).toEqual(
        occupation.pathways[0].total,
      );
    }
  });
  it("uses the directly published aggregate instead of summing suppressed cells to an exact value", () => {
    const occupation = getOccupationEvidence("261111")!;
    expect(occupation.pathways[0].total).toEqual({ min: 7774, max: 7774 });
    expect(occupation.pathways[0].points).toEqual(
      snapshot.occupations[0].points,
    );
    expect(occupation.pathways[0].points.some((p) => p.count === "<20")).toBe(
      true,
    );
  });
  it("keeps unlisted cutoffs distinct from zero and uses occupation-specific published cutoffs", () => {
    expect(getOccupationEvidence("261111")?.rounds[0].cutoff).toBeNull();
    expect(getOccupationEvidence("261111")?.rounds[4].cutoff).toBe(95);
    expect(getOccupationEvidence("254499")?.rounds[0].cutoff).toBe(70);
    expect(getOccupationEvidence("241111")?.rounds[0].cutoff).toBe(90);
    expect(getOccupationEvidence("241411")?.rounds[0].cutoff).toBe(80);
    expect(getOccupationEvidence("not-imported")).toBeUndefined();
  });
  it("bounds a net change across masked snapshots without treating it as gross inflow", () => {
    expect(netPoolChange({ min: 0, max: 19 }, { min: 30, max: 30 })).toEqual({
      min: 11,
      max: 30,
    });
    expect(netPoolChange({ min: 30, max: 30 }, { min: 0, max: 19 })).toEqual({
      min: -30,
      max: -11,
    });
  });
  it("rejects duplicate dates and inconsistent aggregate/distribution relationships", () => {
    const occupation = structuredClone(getOccupationEvidence("261111")!);
    occupation.trend[1].date = occupation.trend[0].date;
    occupation.pathways[0].total = { min: 1, max: 1 };
    expect(validateOccupationEvidence(occupation)).toEqual([
      "Monthly dates must be unique and increasing",
      "189 aggregate is inconsistent with its score intervals",
    ]);
  });
});
