import { describe, expect, it } from "vitest";
import { activityCoreFixture, coreFixture } from "./__fixtures__/occupation";
import { stateEvidence } from "./state-evidence";

describe("stateEvidence", () => {
  const result = stateEvidence(activityCoreFixture, "190", "VIC", 87);

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
      { asAt: "2026-10", invitedAtLeast: { min: 5, max: 5 } },
    ]);
  });

  it("derives the score range from positive cells", () => {
    expect(result.state.scoreRange).toEqual({ min: 80, max: 95 });
  });

  it("limits to the latest months", () => {
    const one = stateEvidence(activityCoreFixture, "190", "VIC", 85, 1);
    expect(one.state.invitedAtOrBelow.map((m) => m.asAt)).toEqual(["2026-10"]);
  });

  it("returns zeros and nulls when the occupation has no state rows", () => {
    const empty = stateEvidence(coreFixture, "491", "NSW", 90).state;
    expect(empty).toEqual({
      competitorsAtOrAbove: { min: 0, max: 0 },
      invitedAtOrBelow: [],
      peak: null,
      scoreRange: null,
    });
  });
});
