import { describe, expect, it } from "vitest";
import { emptyProfile } from "./migration";
import { sampleReportProfile } from "./sample";
import { answersError, stepError } from "./check-validation";

const AS_OF = "2026-11-17";

describe("stepError", () => {
  it("asks for each step's missing answers", () => {
    expect(stepError(0, emptyProfile, AS_OF)).toMatch(/date of birth/);
    expect(stepError(1, emptyProfile, AS_OF)).toMatch(/English level/);
    expect(stepError(2, emptyProfile, AS_OF)).toMatch(/partner category/);
  });

  it("refuses future dates", () => {
    const future = { ...sampleReportProfile, eoiDate: "2027-01-01" };
    expect(stepError(2, future, AS_OF)).toMatch(/cannot be in the future/);
  });
});

describe("answersError", () => {
  it("passes complete answers and reports the first problem", () => {
    expect(answersError(sampleReportProfile, AS_OF)).toBeNull();
    expect(
      answersError({ ...sampleReportProfile, partner: "unknown" }, AS_OF),
    ).toMatch(/partner/);
  });
});
