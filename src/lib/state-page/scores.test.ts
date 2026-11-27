import { describe, expect, it } from "vitest";
import { C, FIXTURE_CORES } from "./__fixtures__/cores";
import { lowestPublishedScore, stateScoreSums, stateScoreView } from "./scores";

describe("state score sums", () => {
  it("sums every occupation at each score, ascending", () => {
    expect(stateScoreSums(FIXTURE_CORES, "190", "NSW", "2026-10")).toEqual([
      { score: 70, count: { min: 0, max: 19 } },
      { score: 80, count: { min: 70, max: 70 } },
      { score: 85, count: { min: 21, max: 21 } },
      { score: 90, count: { min: 0, max: 19 } },
    ]);
  });

  it("finds no published score when every count is hidden", () => {
    const sums = stateScoreSums([C], "190", "NSW", "2026-10");
    expect(lowestPublishedScore(sums)).toBeNull();
    expect(
      lowestPublishedScore(
        stateScoreSums(FIXTURE_CORES, "190", "NSW", "2026-10"),
      ),
    ).toBe(80);
  });

  it("trims to one score either side of the published ones and marks 65", () => {
    const sums = [
      { score: 60, count: { min: 0, max: 19 } },
      { score: 65, count: { min: 0, max: 19 } },
      { score: 70, count: { min: 30, max: 30 } },
      { score: 75, count: { min: 0, max: 19 } },
      { score: 80, count: { min: 0, max: 19 } },
    ];
    const view = stateScoreView(sums, "190", "NSW", "2026-10");
    expect(view.bars.map((b) => b.score)).toEqual(["65", "70", "75"]);
    expect(view.bars.map((b) => b.passMark)).toEqual([true, false, false]);
    expect(view.bars[0].label).toBe("under 20");
    expect(view.heading).toBe(
      "NSW 190: points of EOIs holding an invitation, 31 Oct 2026",
    );
  });
});
