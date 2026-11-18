import { describe, expect, it } from "vitest";
import { activityCoreFixture, coreFixture } from "./__fixtures__/occupation";
import { stateEvidence } from "./state-evidence";

describe("stateEvidence", () => {
  const result = stateEvidence(activityCoreFixture, "190", "VIC", 87, 3);

  it("never sums INVITED across months", () => {
    // 87 normalises to 85: Aug 80 -> 50, Sep 85 -> 50 (95 excluded).
    expect(result.state.invitedAtOrBelow).toEqual([
      { asAt: "2026-08", invitedAtLeast: { min: 50, max: 50 } },
      { asAt: "2026-09", invitedAtLeast: { min: 50, max: 50 } },
      { asAt: "2026-10", invitedAtLeast: { min: 0, max: 19 } },
    ]);
    expect(result.state.peak).toEqual({
      asAt: "2026-09",
      invitedAtLeast: { min: 50, max: 50 },
    });
    expect(JSON.stringify(result.state.invitedAtOrBelow)).not.toMatch(
      /"(min|max)":100\b/,
    );
  });

  it("sums competitors at or above the normalised score, excluding ANY", () => {
    // 85 (<20) + 90 (10)
    expect(result.state.competitorsAtOrAbove).toEqual({ min: 10, max: 29 });
  });

  it("computes anyState from ANY rows only", () => {
    expect(result.anyState.competitorsAtOrAbove).toEqual({ min: 10, max: 10 });
    expect(result.anyState.invitedAtOrBelow).toEqual([
      { asAt: "2026-09", invitedAtLeast: { min: 0, max: 0 } },
      { asAt: "2026-10", invitedAtLeast: { min: 5, max: 5 } },
    ]);
  });

  it("reports an uncovered month as not published, never zero", () => {
    expect(result.anyState.notPublished).toEqual(["2026-08"]);
    expect(result.state.notPublished).toEqual([]);
  });

  it("builds the window back from asAt, not from the stored keys", () => {
    // 2025-06 (score 70) is outside the 12 months ending 2026-10.
    const year = stateEvidence(activityCoreFixture, "190", "VIC", 87);
    expect(year.state.invitedAtOrBelow.map((m) => m.asAt)).toEqual([
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(year.state.scoreRange).toEqual({ min: 80, max: 95 });
    expect(year.state.notPublished).toHaveLength(9);
  });

  it("derives the score range from positive cells", () => {
    expect(result.state.scoreRange).toEqual({ min: 80, max: 95 });
  });

  it("limits to the latest months", () => {
    const one = stateEvidence(activityCoreFixture, "190", "VIC", 85, 1);
    expect(one.state.invitedAtOrBelow.map((m) => m.asAt)).toEqual(["2026-10"]);
  });

  it("has no peak when no month confirms an invitation", () => {
    const low = stateEvidence(activityCoreFixture, "190", "VIC", 70, 3);
    expect(low.anyState.peak).toBeNull();
  });

  it("returns zeros, nulls and every month not published without state rows", () => {
    const empty = stateEvidence(coreFixture, "491", "NSW", 90, 2).state;
    expect(empty).toEqual({
      competitorsAtOrAbove: null,
      invitedAtOrBelow: [],
      notPublished: ["2026-09", "2026-10"],
      peak: null,
      scoreRange: null,
    });
  });
});
