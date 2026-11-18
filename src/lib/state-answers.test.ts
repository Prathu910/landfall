import { describe, expect, it } from "vitest";
import { emptyProfile } from "./migration";
import { restoreProfile } from "./state-answers";

describe("restoreProfile", () => {
  it("restores a profile saved before the state answers existed as unanswered", () => {
    const restored = restoreProfile({ ...emptyProfile, name: "Old" });
    expect(restored.name).toBe("Old");
    expect(restored.monthsLivingInState).toBeUndefined();
    expect(restored.jobOfferState).toBeUndefined();
  });

  it("keeps valid answers", () => {
    const restored = restoreProfile({
      ...emptyProfile,
      monthsLivingInState: 14,
      monthsWorkingInState: 0,
      yearsExperienceLast3: 2.5,
      yearsExperienceLast10: 10,
      jobOfferState: "none",
      studyState: "WA",
      livesRegional: false,
      incomeBand: "60-90k",
    });
    expect(restored).toMatchObject({
      monthsLivingInState: 14,
      monthsWorkingInState: 0,
      yearsExperienceLast3: 2.5,
      yearsExperienceLast10: 10,
      jobOfferState: "none",
      studyState: "WA",
      livesRegional: false,
      incomeBand: "60-90k",
    });
  });

  it("drops invalid values but keeps the other answers", () => {
    const restored = restoreProfile({
      ...emptyProfile,
      name: "Kept",
      monthsLivingInState: -1,
      monthsWorkingInState: 601,
      monthsLivingOffshore: 1.5,
      yearsExperienceLast3: 3.5,
      yearsExperienceLast5: 2.25,
      yearsExperienceLast10: 11,
      jobOfferState: "XX",
      studyState: 3,
      livesRegional: "yes",
      incomeBand: "rich",
    });
    expect(restored.name).toBe("Kept");
    for (const key of [
      "monthsLivingInState",
      "monthsWorkingInState",
      "monthsLivingOffshore",
      "yearsExperienceLast3",
      "yearsExperienceLast5",
      "yearsExperienceLast10",
      "jobOfferState",
      "studyState",
      "livesRegional",
      "incomeBand",
    ]) {
      expect(restored).not.toHaveProperty(key);
    }
  });

  it("treats null as unanswered and enforces window limits", () => {
    const restored = restoreProfile({
      ...emptyProfile,
      monthsLivingInState: null,
      yearsExperienceLast5: 5,
      yearsExperienceLast3: 3,
    });
    expect(restored).not.toHaveProperty("monthsLivingInState");
    expect(restored.yearsExperienceLast5).toBe(5);
    expect(restored.yearsExperienceLast3).toBe(3);
  });

  it("accepts the 0 and 600 month bounds", () => {
    const restored = restoreProfile({
      ...emptyProfile,
      monthsLivingInState: 600,
      monthsLivingOffshore: 0,
    });
    expect(restored.monthsLivingInState).toBe(600);
    expect(restored.monthsLivingOffshore).toBe(0);
  });
});
