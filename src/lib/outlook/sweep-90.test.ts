import { describe, expect, it } from "vitest";
import { calculatePoints } from "../migration";
import { AS_OF } from "./__fixtures__/scenario-input";
import { OCCUPATIONS, sweepProblems, sweepProfile } from "./__fixtures__/sweep";

// One file per level so vitest runs the sweep (final review, R32) in parallel.
describe("outlook sweep over every occupation at 90 points", () => {
  it("covers the whole snapshot at 90 points", () => {
    expect(OCCUPATIONS.length).toBe(493);
    expect(calculatePoints(sweepProfile(90, false), AS_OF).base).toBe(90);
  });

  it("planner: every view is consistent", () => {
    expect(sweepProblems(90, false)).toEqual([]);
  }, 30_000);
  it("lodged: every view is consistent", () => {
    expect(sweepProblems(90, true)).toEqual([]);
  }, 30_000);
});
