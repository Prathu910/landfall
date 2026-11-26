import { describe, expect, it } from "vitest";
import { emptyProfile, sampleProfile } from "./migration";
import { parseProfile, toExperienceYears } from "./profile-guard";
import { SCENARIOS } from "./outlook/__fixtures__/scenarios";

describe("parseProfile", () => {
  it("accepts every scenario profile", () => {
    for (const [id, profile] of Object.entries(SCENARIOS)) {
      expect(parseProfile(profile), id).toEqual(profile);
    }
    expect(parseProfile(sampleProfile)).toEqual(sampleProfile);
  });

  it("returns a new object", () => {
    const out = parseProfile(emptyProfile);
    expect(out).toEqual(emptyProfile);
    expect(out).not.toBe(emptyProfile);
  });

  it("rejects bad dates, enums, codes and ranges", () => {
    const bad: Record<string, unknown>[] = [
      { dob: "1994-8-9" },
      { dob: "1994-02-31" },
      { english: "fluent" },
      { partner: "married" },
      { qualification: "masters" },
      { occupation: "12345" },
      { occupation: "012345" },
      { name: "x".repeat(61) },
      { state: "XX" },
      { overseasYears: 51 },
      { australianYears: 2.3 },
      { overseasYears: 0.1 },
      { australianYears: -0.5 },
      { overseasYears: -1 },
      { monthsLivingInState: 601 },
      { yearsExperienceLast3: 3.5 },
      { yearsExperienceLast10: 11 },
      { jobOfferState: "XX" },
      { incomeBand: "rich" },
      { livesRegional: "yes" },
      { onshore: "true" },
    ];
    for (const patch of bad) {
      expect(
        parseProfile({ ...emptyProfile, ...patch }),
        JSON.stringify(patch),
      ).toBeNull();
    }
    expect(parseProfile(null)).toBeNull();
    expect(parseProfile([])).toBeNull();
    const { dob: _dob, ...missing } = emptyProfile;
    void _dob;
    expect(parseProfile(missing)).toBeNull();
  });

  it("accepts experience in half years, as the check's fields produce", () => {
    for (const patch of [
      { overseasYears: 2.5 },
      { australianYears: 0.5 },
      { overseasYears: 7.5, australianYears: 1.5 },
    ]) {
      const profile = { ...sampleProfile, ...patch };
      expect(parseProfile(profile), JSON.stringify(patch)).toEqual(profile);
    }
  });

  it("drops unknown keys", () => {
    const out = parseProfile({ ...emptyProfile, email: "a@b.co", extra: 1 });
    expect(out).toEqual(emptyProfile);
    expect(out).not.toHaveProperty("email");
  });

  it("accepts an old saved profile without Sharpen fields", () => {
    expect(parseProfile({ ...sampleProfile })).toEqual(sampleProfile);
    const withNulls = {
      ...sampleProfile,
      monthsLivingInState: null,
      state: "NSW",
    };
    expect(parseProfile(withNulls)).toEqual(withNulls);
  });
});

describe("toExperienceYears", () => {
  it("rounds down to a half year within 0 to 10", () => {
    expect(toExperienceYears(2.5)).toBe(2.5);
    expect(toExperienceYears(2.8)).toBe(2.5);
    expect(toExperienceYears(2.3)).toBe(2);
    expect(toExperienceYears(11)).toBe(10);
    expect(toExperienceYears(-1)).toBe(0);
    expect(toExperienceYears("")).toBe(0);
    expect(
      parseProfile({ ...emptyProfile, overseasYears: toExperienceYears(7.3) }),
    ).not.toBeNull();
  });
});
