import { describe, expect, it } from "vitest";
import {
  validateCalculation,
  validateFeedback,
  normalizeEmail,
  PRIVACY_VERSION,
} from "./contract";
import { calculationSummary } from "./summary";
import { calculatePoints, sampleProfile } from "../migration";
const summary = {
  occupation_code: "254499",
  age_band: "25-32",
  location: "onshore",
  base_points: 75,
  points_190: 80,
  points_491: 90,
  snapshot_id: "skillselect-2026-10-31",
};
const calculation = {
  id: "89f41b59-e655-4dda-9f51-6ce1ef99ca2d",
  email: "Test@Example.com",
  summary,
  privacy_version: "2026-11-20",
};
const feedback = {
  id: calculation.id,
  category: "suggestion",
  message: "Please add a comparison tool.",
  email: null,
  summary: null,
  privacy_version: "2026-11-20",
};
describe("submission boundaries", () => {
  it("accepts only the disclosed calculation fields", () => {
    expect(validateCalculation(calculation).ok).toBe(true);
    expect(validateCalculation({ ...calculation, dob: "1994-08-09" }).ok).toBe(
      false,
    );
    expect(
      validateCalculation({
        ...calculation,
        summary: { ...summary, name: "Private" },
      }).ok,
    ).toBe(false);
  });
  it("requires valid email, UUID, current disclosure and plausible nomination totals", () => {
    for (const email of [
      "",
      "someone",
      "a@b",
      "a b@example.com",
      "a\n@example.com",
      "a".repeat(255) + "@example.com",
    ])
      expect(validateCalculation({ ...calculation, email }).ok).toBe(false);
    expect(validateCalculation({ ...calculation, id: "not-a-uuid" }).ok).toBe(
      false,
    );
    expect(
      validateCalculation({ ...calculation, privacy_version: "old" }).ok,
    ).toBe(false);
    for (const patch of [
      { base_points: 71.5 },
      { points_190: 90 },
      { occupation_code: "123" },
      { snapshot_id: "yesterday" },
      { location: "India" },
      { age_band: "32" },
    ])
      expect(
        validateCalculation({
          ...calculation,
          summary: { ...summary, ...patch },
        }).ok,
      ).toBe(false);
    expect(PRIVACY_VERSION).toBe(calculation.privacy_version);
  });
  it("preserves email local-part spelling while normalizing the domain", () => {
    expect(normalizeEmail("  Test@EXAMPLE.COM  ")).toBe("Test@example.com");
  });
  it("allows feedback without email or report context, but rejects extra data and bad content", () => {
    expect(validateFeedback(feedback).ok).toBe(true);
    expect(
      validateFeedback({ ...feedback, email: "reply@example.com", summary }).ok,
    ).toBe(true);
    for (const patch of [
      { message: "short" },
      { message: "x".repeat(3001) },
      { email: "invalid" },
      { category: "injected" },
      { profile: sampleProfile },
    ])
      expect(validateFeedback({ ...feedback, ...patch }).ok).toBe(false);
  });
});
describe("calculationSummary", () => {
  it("projects the allowlist without personal dates or name", () => {
    const profile = { ...sampleProfile, onshore: true };
    const result = calculationSummary(
      profile,
      calculatePoints(profile, "2026-11-20"),
      "2026-11-20",
      "2026-10-31",
    );
    expect(result.age_band).toBe("25-32");
    expect(Object.keys(result).sort()).toEqual(Object.keys(summary).sort());
    expect(JSON.stringify(result)).not.toContain(profile.dob);
    expect(result.snapshot_id).toBe("skillselect-2026-10-31");
  });
  it("uses the calculator's birthday boundary, including leap-day birthdays", () => {
    const make = (dob: string, asOf: string) => {
      const p = { ...sampleProfile, dob, occupation: "other" };
      return calculationSummary(
        p,
        calculatePoints(p, asOf),
        asOf,
        "2026-10-31",
      );
    };
    expect(make("1993-11-21", "2026-11-20").age_band).toBe("25-32");
    expect(make("1993-11-20", "2026-11-20").age_band).toBe("33-39");
    expect(make("1984-02-29", "2029-02-28").age_band).toBe("45+");
    expect(make("2009-01-01", "2026-11-20").age_band).toBe("under-18");
    expect(make("1994-01-01", "2026-11-20").occupation_code).toBe(
      "points-only",
    );
  });
});

it("counts feedback characters consistently with Postgres for non-BMP text", () => {
  expect(validateFeedback({ ...feedback, message: "😀".repeat(5) }).ok).toBe(
    false,
  );
  expect(validateFeedback({ ...feedback, message: "😀".repeat(10) }).ok).toBe(
    true,
  );
  expect(validateFeedback({ ...feedback, message: "😀".repeat(3000) }).ok).toBe(
    true,
  );
  expect(validateFeedback({ ...feedback, message: "😀".repeat(3001) }).ok).toBe(
    false,
  );
});
