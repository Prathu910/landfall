import { describe, expect, it } from "vitest";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import {
  cutoffSpanText,
  latestRound,
  latestRoundLine,
  latestRoundSentence,
} from "./latest-round";

describe("latestRound", () => {
  it("picks the newest round across every facts file", () => {
    const round = latestRound([roundOnly, twoRounds, dataOnly]);
    expect(round).toEqual({
      date: "2027-03-25",
      invited: 6000,
      occupations: 2,
      lowest: 65,
      highest: 80,
      atLowest: 1,
      month: "2027-03",
    });
  });
  it("is null when no facts file has a round", () => {
    expect(latestRound([dataOnly])).toBeNull();
    expect(latestRound([])).toBeNull();
  });
  it("says the round's date, EOIs invited, occupations and cut-off span", () => {
    const round = latestRound([roundOnly]);
    if (!round) throw new Error("expected a round");
    expect(latestRoundSentence(round)).toBe(
      "In the 19 Nov 2026 189 round, Home Affairs invited 15,000 EOIs across 4 occupations; the lowest score invited ranged from 65 to 95 points by occupation, and 1 occupation was invited at 65.",
    );
    expect(cutoffSpanText(round)).toBe("65 to 95 points");
    expect(latestRoundLine(round)).toBe(
      "Latest 189 round: 19 Nov 2026, 15,000 EOIs invited across 4 occupations.",
    );
  });
  it("gives one score when every cut-off was the same", () => {
    const round = latestRound([
      {
        ...twoRounds,
        rounds: { "2027-03-04": twoRounds.rounds["2027-03-04"] },
      },
    ]);
    if (!round) throw new Error("expected a round");
    expect(cutoffSpanText(round)).toBe("70 points");
    expect(latestRoundSentence(round)).toContain(
      "every occupation's cut-off was 70 points",
    );
  });
});
