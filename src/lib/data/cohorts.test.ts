import { describe, expect, it } from "vitest";
import { detailFixture } from "./__fixtures__/occupation";
import { cohortOutcomes } from "./cohorts";

describe("cohortOutcomes", () => {
  it("returns all five statuses, absent ones as zero", () => {
    expect(cohortOutcomes(detailFixture, "189", "2025-03")).toEqual({
      submittedMonth: "2025-03",
      counts: {
        SUBMITTED: { min: 25, max: 25 },
        INVITED: { min: 0, max: 0 },
        LODGED: { min: 4, max: 4 },
        HOLD: { min: 0, max: 0 },
        CLOSED: { min: 0, max: 0 },
      },
    });
  });

  it("returns undefined for an unknown month", () => {
    expect(cohortOutcomes(detailFixture, "189", "1999-01")).toBeUndefined();
  });
});
