import { describe, expect, it } from "vitest";
import { calculatePoints } from "../migration";
import { AS_OF } from "./__fixtures__/scenario-input";
import {
  OCCUPATION_COUNT,
  OCCUPATIONS,
  sweepProblems,
  sweepProfile,
} from "./__fixtures__/sweep";

// One file per level so vitest runs the sweep (final review, R32) in parallel.
describe("outlook sweep over every occupation at 60 points", () => {
  it("covers the whole snapshot at 60 points", () => {
    expect(OCCUPATIONS.length).toBe(OCCUPATION_COUNT);
    expect(OCCUPATIONS.length).toBeGreaterThan(400);
    expect(calculatePoints(sweepProfile(60, false), AS_OF).base).toBe(60);
  });

  it("planner: every view is consistent", () => {
    expect(sweepProblems(60, false)).toEqual([]);
  }, 30_000);
});
