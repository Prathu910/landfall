import { emptyProfile, type Profile } from "../migration";
import { SAMPLE_COMPARISON, sampleReportProfile } from "../sample";

export type ExampleId = "strong" | "middle" | "notinv" | "none";

const base = (fields: Partial<Profile>): Profile => ({
  ...emptyProfile,
  onshore: false,
  ...fields,
});

/**
 * The four fictional profiles behind /sample/. They live here, not in the
 * test fixtures, so the page and the scenario tests read the same people.
 */
export const EXAMPLE_PROFILES: Record<ExampleId, Profile> = {
  // Aarav, without his lodged EOI, so the report reads as a first look.
  strong: { ...sampleReportProfile, eoiDate: "" },
  middle: base({
    name: "Priya",
    dob: "1994-03-14",
    occupation: "254499",
    english: "proficient",
    englishDate: "2025-02-02",
    qualification: "bachelor",
    overseasYears: 4,
    partner: "single",
    assessmentExpiry: "2028-06-10",
  }),
  notinv: base({
    name: "Rahul",
    dob: "1996-01-18",
    occupation: "261313",
    english: "superior",
    englishDate: "2024-06-05",
    qualification: "bachelor",
    overseasYears: 6,
    partner: "single",
  }),
  none: base({
    name: "Dev",
    dob: "1991-09-09",
    occupation: "221214",
    english: "proficient",
    englishDate: "2024-08-01",
    qualification: "bachelor",
    overseasYears: 9,
    partner: "english",
    communityLanguage: true,
  }),
};

/** Tab order and names are the founder's (spec section 5). */
export const EXAMPLES: { id: ExampleId; tab: string; profile: Profile }[] = [
  { id: "strong", tab: "Strong", profile: EXAMPLE_PROFILES.strong },
  { id: "middle", tab: "In the middle", profile: EXAMPLE_PROFILES.middle },
  { id: "notinv", tab: "189 closed", profile: EXAMPLE_PROFILES.notinv },
  { id: "none", tab: "Nothing suits", profile: EXAMPLE_PROFILES.none },
];

/** The occupations /sample/ reads: each example's, then the comparison's. */
export const SAMPLE_CODES: readonly string[] = [
  ...new Set([
    ...EXAMPLES.map(({ profile }) => profile.occupation),
    SAMPLE_COMPARISON,
  ]),
];
