import { describe, expect, it } from "vitest";
import { OPEN_OVERVIEW, START_OVER, TRY_SAMPLE_ANSWERS } from "./check-actions";

describe("check actions", () => {
  it("names the check's buttons once, for the check and the homepage demo", () => {
    expect([START_OVER, TRY_SAMPLE_ANSWERS, OPEN_OVERVIEW]).toEqual([
      "Start over",
      "Try sample answers",
      "Open my overview",
    ]);
  });
});
