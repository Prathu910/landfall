import { describe, expect, it } from "vitest";
import { emptyProfile, type Profile } from "./migration";
import { resetStateRelativeAnswers, restoreProfile } from "./state-answers";

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

describe("resetStateRelativeAnswers", () => {
  const answered: Profile = {
    ...emptyProfile,
    onshore: true,
    state: "QLD",
    monthsLivingInState: 14,
    monthsWorkingInState: 14,
    monthsLivingOffshore: 3,
    livesRegional: true,
    yearsExperienceLast10: 8,
    jobOfferState: "QLD",
  };

  it("clears the answers about the state you live in when the state changes", () => {
    const next = resetStateRelativeAnswers(answered, {
      ...answered,
      state: "NSW",
    });
    expect(next.state).toBe("NSW");
    expect(next.monthsLivingInState).toBeNull();
    expect(next.monthsWorkingInState).toBeNull();
    expect(next.livesRegional).toBeNull();
    // Not tied to where you live now.
    expect(next.monthsLivingOffshore).toBe(3);
    expect(next.yearsExperienceLast10).toBe(8);
    expect(next.jobOfferState).toBe("QLD");
  });

  it("also clears months offshore when onshore changes", () => {
    const next = resetStateRelativeAnswers(answered, {
      ...answered,
      onshore: false,
    });
    expect(next.monthsLivingInState).toBeNull();
    expect(next.monthsWorkingInState).toBeNull();
    expect(next.livesRegional).toBeNull();
    expect(next.monthsLivingOffshore).toBeNull();
  });

  it("clears the answers about your occupation's work when the occupation changes (ruling P30)", () => {
    const withYears: Profile = {
      ...answered,
      occupation: "261313",
      yearsExperienceLast3: 3,
      yearsExperienceLast5: 4.5,
    };
    const next = resetStateRelativeAnswers(withYears, {
      ...withYears,
      occupation: "254499",
    });
    expect(next.occupation).toBe("254499");
    expect(next.monthsWorkingInState).toBeNull();
    expect(next.yearsExperienceLast3).toBeNull();
    expect(next.yearsExperienceLast5).toBeNull();
    expect(next.yearsExperienceLast10).toBeNull();
    // Still true whatever the occupation.
    expect(next.monthsLivingInState).toBe(14);
    expect(next.monthsLivingOffshore).toBe(3);
    expect(next.livesRegional).toBe(true);
    expect(next.jobOfferState).toBe("QLD");
  });

  it("keeps every answer when neither the state nor onshore changes", () => {
    const next = { ...answered, name: "Priya", monthsLivingInState: 20 };
    expect(resetStateRelativeAnswers(answered, next)).toEqual(next);
  });
});
