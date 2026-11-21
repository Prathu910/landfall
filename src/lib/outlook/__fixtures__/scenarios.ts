import { emptyProfile, type Profile } from "../../migration";
import { sampleReportProfile } from "../../sample";

export type ScenarioId =
  | "strong"
  | "middle"
  | "long"
  | "notinv"
  | "below"
  | "nodata"
  | "none"
  | "lodged";

const base = (fields: Partial<Profile>): Profile => ({
  ...emptyProfile,
  onshore: false,
  ...fields,
});

export const SCENARIOS: Record<ScenarioId, Profile> = {
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
  long: base({
    name: "Meera",
    dob: "1998-05-02",
    occupation: "241111",
    english: "superior",
    englishDate: "2025-01-10",
    qualification: "bachelor",
    overseasYears: 4,
    partner: "single",
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
  below: base({
    name: "Arjun",
    dob: "1996-07-22",
    occupation: "254499",
    english: "competent",
    englishDate: "2024-09-09",
    qualification: "bachelor",
    overseasYears: 3,
    partner: "single",
  }),
  nodata: base({
    name: "Sana",
    dob: "1997-04-12",
    occupation: "362311",
    english: "proficient",
    englishDate: "2026-01-30",
    qualification: "trade",
    overseasYears: 8,
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
  lodged: base({
    name: "Kavya",
    dob: "1992-06-25",
    occupation: "254499",
    english: "proficient",
    englishDate: "2026-01-04",
    qualification: "bachelor",
    overseasYears: 6,
    partner: "english",
    communityLanguage: true,
    eoiDate: "2026-03-12",
  }),
};

export const ENDOCRINOLOGIST: Profile = base({
  dob: "1988-02-03",
  occupation: "253315",
  english: "superior",
  englishDate: "2025-11-11",
  qualification: "bachelor",
  overseasYears: 9,
  partner: "english",
});
