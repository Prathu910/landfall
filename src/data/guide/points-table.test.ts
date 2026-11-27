import { describe, expect, it } from "vitest";
import {
  calculatePoints,
  emptyProfile,
  type Profile,
} from "../../lib/migration";
import { PASS_MARK, POINTS_TABLE } from "./points-table";

const AS_OF = "2026-11-23";

/** A date of birth that makes the profile `age` on AS_OF. */
const bornAged = (age: number) => `${2026 - age}-01-01`;

type Probe = {
  profile: Partial<Profile>;
  /** The calculator's points for the row: one category, or a visa's extra. */
  read: (profile: Profile) => number;
};

const category = (key: string) => (profile: Profile) =>
  calculatePoints(profile, AS_OF).categories.find((c) => c.key === key)
    ?.points ?? Number.NaN;

const extra = (visa: "190" | "491") => (profile: Profile) => {
  const result = calculatePoints(profile, AS_OF);
  return (
    (visa === "190" ? result.subclass190 : result.subclass491) - result.base
  );
};

/** Both ends of every band, so a moved boundary fails. */
const AGE_ENDS: Record<string, [number, number]> = {
  "age-18-24": [18, 24],
  "age-25-32": [25, 32],
  "age-33-39": [33, 39],
  "age-40-44": [40, 44],
};

const EMPLOYMENT: Record<string, Partial<Profile>> = {
  "overseas-3": { overseasYears: 3 },
  "overseas-5": { overseasYears: 5 },
  "overseas-8": { overseasYears: 8 },
  "australia-1": { australianYears: 1 },
  "australia-3": { australianYears: 3 },
  "australia-5": { australianYears: 5 },
  "australia-8": { australianYears: 8 },
  "employment-cap": { overseasYears: 10, australianYears: 10 },
};

const PROBES: Record<string, Probe> = {
  "english-competent": {
    profile: { english: "competent" },
    read: category("english"),
  },
  "english-proficient": {
    profile: { english: "proficient" },
    read: category("english"),
  },
  "english-superior": {
    profile: { english: "superior" },
    read: category("english"),
  },
  ...Object.fromEntries(
    Object.entries(EMPLOYMENT).map(([id, profile]) => [
      id,
      { profile, read: category("employment") },
    ]),
  ),
  doctorate: {
    profile: { qualification: "doctorate" },
    read: category("qualification"),
  },
  bachelor: {
    profile: { qualification: "bachelor" },
    read: category("qualification"),
  },
  diploma: {
    profile: { qualification: "trade" },
    read: category("qualification"),
  },
  specialist: {
    profile: { specialistEducation: true },
    read: category("specialist-education"),
  },
  "australian-study": {
    profile: { ausStudy: true },
    read: category("australian-study"),
  },
  "regional-study": {
    profile: { ausStudy: true, regionalStudy: true },
    read: category("regional-study"),
  },
  "professional-year": {
    profile: {
      occupation: "261313",
      professionalYear: true,
      professionalYearDate: "2025-06-30",
    },
    read: category("professional-year"),
  },
  "community-language": {
    profile: {
      communityLanguage: true,
      communityLanguageExpiry: "2029-01-01",
    },
    read: category("community-language"),
  },
  "partner-single": {
    profile: { partner: "single" },
    read: category("partner"),
  },
  "partner-skilled": {
    profile: { partner: "skilled" },
    read: category("partner"),
  },
  "partner-english": {
    profile: { partner: "english" },
    read: category("partner"),
  },
  "nomination-190": { profile: {}, read: extra("190") },
  "nomination-491": { profile: {}, read: extra("491") },
};

describe("the points table page agrees with calculatePoints", () => {
  const rows = POINTS_TABLE.flatMap((f) => f.rows);

  it("gives every row its own id", () => {
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  for (const row of rows) {
    it(`${row.id}: ${row.band} = ${row.points}`, () => {
      const ends = AGE_ENDS[row.id];
      if (ends) {
        for (const age of ends) {
          const profile = { ...emptyProfile, dob: bornAged(age) };
          expect(category("age")(profile), `age ${age}`).toBe(row.points);
        }
        return;
      }
      const probe = PROBES[row.id];
      expect(probe, `no calculator probe for ${row.id}`).toBeDefined();
      expect(probe.read({ ...emptyProfile, ...probe.profile })).toBe(
        row.points,
      );
    });
  }

  it("gives no age points at 45, the age limit the age note states", () => {
    expect(category("age")({ ...emptyProfile, dob: bornAged(45) })).toBe(0);
  });

  it("dates and sources every factor, and keeps the 65 pass mark", () => {
    expect(PASS_MARK).toBe(65);
    for (const factor of POINTS_TABLE) {
      expect(factor.source).toMatch(/^https:\/\/immi\.homeaffairs\.gov\.au\//);
      expect(factor.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(factor.question).toMatch(/\?$/);
    }
  });
});
