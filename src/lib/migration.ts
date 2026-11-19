import type { StateCode } from "./data/types";

export type Profile = {
  name: string;
  dob: string;
  occupation: string;
  english: "unknown" | "competent" | "proficient" | "superior";
  englishDate: string;
  qualification: "unknown" | "none" | "trade" | "bachelor" | "doctorate";
  overseasYears: number;
  australianYears: number;
  ausStudy: boolean;
  regionalStudy: boolean;
  specialistEducation: boolean;
  professionalYear: boolean;
  professionalYearDate: string;
  communityLanguage: boolean;
  communityLanguageExpiry: string;
  partner: "unknown" | "single" | "citizen" | "skilled" | "english" | "none";
  onshore: boolean;
  state: string;
  visaExpiry: string;
  assessmentDate: string;
  assessmentExpiry: string;
  eoiDate: string;
  // Optional "Sharpen my state outlook" answers. Absent or null = unanswered.
  /** Continuous months up to now living in the state the user currently lives in. */
  monthsLivingInState?: number | null;
  /** Continuous months up to now working in the nominated occupation, or a state-defined related occupation, in the state they live in. */
  monthsWorkingInState?: number | null;
  /** Continuous months up to now living offshore. */
  monthsLivingOffshore?: number | null;
  /** Years of skilled experience in the last 3 years (0-3). */
  yearsExperienceLast3?: number | null;
  /** Years of skilled experience in the last 5 years (0-5). */
  yearsExperienceLast5?: number | null;
  /** Years of skilled experience in the last 10 years (0-10). */
  yearsExperienceLast10?: number | null;
  jobOfferState?: StateCode | "none" | null;
  livesRegional?: boolean | null;
  studyState?: StateCode | "none" | null;
  /** Stored only; unused until a future visa-points tool needs it. */
  incomeBand?: "under-60k" | "60-90k" | "90-130k" | "over-130k" | null;
};
export const emptyProfile: Profile = {
  name: "",
  dob: "",
  occupation: "",
  english: "unknown",
  englishDate: "",
  qualification: "unknown",
  overseasYears: 0,
  australianYears: 0,
  ausStudy: false,
  regionalStudy: false,
  specialistEducation: false,
  professionalYear: false,
  professionalYearDate: "",
  communityLanguage: false,
  communityLanguageExpiry: "",
  partner: "unknown",
  onshore: false,
  state: "",
  visaExpiry: "",
  assessmentDate: "",
  assessmentExpiry: "",
  eoiDate: "",
};
export const sampleProfile: Profile = {
  ...emptyProfile,
  name: "Aarav",
  dob: "1994-08-09",
  occupation: "254499",
  english: "superior",
  englishDate: "2025-02-02",
  qualification: "bachelor",
  overseasYears: 3,
  australianYears: 1,
  ausStudy: true,
  partner: "single",
};
export type PointCategory = {
  key: string;
  label: string;
  points: number;
  max: number;
};
export type PointsResult = {
  base: number;
  subclass190: number;
  subclass491: number;
  categories: PointCategory[];
  missing: string[];
  warnings: string[];
  eligible: boolean | null;
  /** Why `eligible` is false, shortest first: "age 45 or over". Empty otherwise. */
  ineligibleReasons: string[];
  /** Date answers that are empty or invalid, so eligibility can't be confirmed. */
  uncheckedDates: UncheckedDate[];
};
export type UncheckedDate =
  "englishDate" | "assessmentDate" | "assessmentExpiry";
export type TimelineEvent = {
  date: string;
  title: string;
  description: string;
  kind: "gain" | "loss" | "expiry" | "info";
  delta?: number;
};
// Dates are calendar dates: parsing and arithmetic never depend on the host time zone.
function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 2200) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}
function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function addYears(date: Date, years: number): Date {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}
function ageOn(dob: Date, today: Date): number {
  const years = today.getUTCFullYear() - dob.getUTCFullYear();
  return years - (today < addYears(dob, years) ? 1 : 0);
}
function agePoints(age: number): number {
  return age < 18 || age >= 45
    ? 0
    : age < 25
      ? 25
      : age < 33
        ? 30
        : age < 40
          ? 25
          : 15;
}
function assessmentEnd(profile: Profile): Date | null {
  const issued = parseDate(profile.assessmentDate);
  const letterEnd = parseDate(profile.assessmentExpiry);
  const cap = issued ? addYears(issued, 3) : null;
  return cap && letterEnd
    ? cap < letterEnd
      ? cap
      : letterEnd
    : (cap ?? letterEnd);
}
function supportsProfessionalYear(occupation: string): boolean {
  return (
    occupation.trim() === "other" ||
    /^(26\d{4}|233\d{3}|2211\d{2})$/.test(occupation.trim())
  );
}
function finiteYears(value: number): number {
  return Number.isFinite(value) ? Math.min(10, Math.max(0, value)) : 0;
}

/** A self-reported federal points estimate. `eligible` covers age, English and assessment only, never full visa eligibility. */
export function calculatePoints(profile: Profile, asOf: string): PointsResult {
  const today = parseDate(asOf);
  if (!today)
    return {
      base: 0,
      subclass190: 5,
      subclass491: 15,
      categories: [],
      missing: ["Valid calculation date"],
      warnings: ["Enter a valid calendar date to calculate an estimate."],
      eligible: null,
      ineligibleReasons: [],
      uncheckedDates: [],
    };
  const missing: string[] = [];
  const warnings: string[] = [];
  const categories: PointCategory[] = [];
  // Each reason the modeled eligibility fails; any reason means `false`.
  const ineligibleReasons: string[] = [];
  const uncheckedDates: UncheckedDate[] = [];
  const add = (key: string, label: string, points: number, max: number) =>
    categories.push({ key, label, points, max });
  const dob = parseDate(profile.dob);
  const age = dob && dob <= today ? ageOn(dob, today) : null;
  if (age === null) missing.push("Date of birth");
  else if (age < 18 || age >= 45) {
    ineligibleReasons.push(age < 18 ? "age under 18" : "age 45 or over");
    warnings.push("Age is outside the modeled 18–44 skilled visa range.");
  }
  add("age", "Age", age === null ? 0 : agePoints(age), 30);

  const englishDate = parseDate(profile.englishDate);
  let englishValid = true;
  if (profile.english === "unknown") missing.push("English proficiency");
  else if (!profile.englishDate) {
    uncheckedDates.push("englishDate");
    warnings.push(
      "English points are self-reported; test validity is unknown without a test date.",
    );
  } else if (!englishDate || englishDate > today) {
    englishValid = false;
    uncheckedDates.push("englishDate");
    warnings.push("English test date is invalid or in the future.");
  } else if (today >= addYears(englishDate, 3)) {
    englishValid = false;
    ineligibleReasons.push("English test expired");
    warnings.push(
      "English test has expired under the modeled three-year validity rule.",
    );
  }
  const englishPoints =
    profile.english === "superior"
      ? 20
      : profile.english === "proficient"
        ? 10
        : 0;
  add("english", "English proficiency", englishValid ? englishPoints : 0, 20);

  const overseas = finiteYears(profile.overseasYears);
  const australian = finiteYears(profile.australianYears);
  if (
    overseas !== profile.overseasYears ||
    australian !== profile.australianYears
  )
    warnings.push(
      "Employment years must be finite values from 0 to 10; this estimate bounds the entered counts to that range.",
    );
  const overseasPoints =
    overseas >= 8 ? 15 : overseas >= 5 ? 10 : overseas >= 3 ? 5 : 0;
  const australianPoints =
    australian >= 8
      ? 20
      : australian >= 5
        ? 15
        : australian >= 3
          ? 10
          : australian >= 1
            ? 5
            : 0;
  add(
    "employment",
    "Skilled employment",
    Math.min(20, overseasPoints + australianPoints),
    20,
  );
  if (overseas || australian)
    warnings.push(
      "Employment assumes qualifying skilled work in the last 10 years; combined points are capped at 20.",
    );
  if (profile.qualification === "unknown")
    missing.push("Highest qualification");
  add(
    "qualification",
    "Highest qualification",
    { unknown: 0, none: 0, trade: 10, bachelor: 15, doctorate: 20 }[
      profile.qualification
    ] ?? 0,
    20,
  );
  add("australian-study", "Australian study", profile.ausStudy ? 5 : 0, 5);
  add(
    "regional-study",
    "Regional Australian study",
    profile.ausStudy && profile.regionalStudy ? 5 : 0,
    5,
  );
  if (profile.regionalStudy && !profile.ausStudy)
    warnings.push(
      "Regional study points require meeting the Australian study requirement.",
    );
  add(
    "specialist-education",
    "Specialist education",
    profile.specialistEducation ? 10 : 0,
    10,
  );

  let pyPoints = 0;
  if (profile.professionalYear) {
    const completed = parseDate(profile.professionalYearDate);
    if (profile.occupation.trim() === "other")
      warnings.push(
        "Professional Year is self-reported for Other; occupation and program eligibility are not verified.",
      );
    if (!supportsProfessionalYear(profile.occupation))
      warnings.push(
        "Professional Year points require a qualifying ICT, engineering or accounting occupation.",
      );
    else if (!profile.professionalYearDate) {
      pyPoints = 5;
      warnings.push(
        "Professional Year points are self-reported; add the completion date.",
      );
    } else if (!completed || completed > today)
      warnings.push(
        "Professional Year completion date is invalid or in the future.",
      );
    else if (today >= addYears(completed, 4))
      warnings.push(
        "Professional Year completion is outside the four-year window.",
      );
    else pyPoints = 5;
  }
  add("professional-year", "Professional Year", pyPoints, 5);

  let languagePoints = 0;
  if (profile.communityLanguage) {
    const expiry = parseDate(profile.communityLanguageExpiry);
    if (!profile.communityLanguageExpiry) {
      languagePoints = 5;
      warnings.push(
        "Community language points are self-reported; add the credential expiry date.",
      );
    } else if (!expiry)
      warnings.push("Community language expiry date is invalid.");
    else if (today >= expiry)
      warnings.push("Community language credential has expired.");
    else languagePoints = 5;
  }
  add(
    "community-language",
    "Credentialled community language",
    languagePoints,
    5,
  );
  if (profile.partner === "unknown") missing.push("Partner status");
  add(
    "partner",
    "Partner qualifications",
    ["single", "citizen", "skilled"].includes(profile.partner)
      ? 10
      : profile.partner === "english"
        ? 5
        : 0,
    10,
  );

  const assessmentDate = parseDate(profile.assessmentDate);
  const assessmentExpiry = assessmentEnd(profile);
  if (!assessmentDate || assessmentDate > today) {
    uncheckedDates.push("assessmentDate");
    warnings.push(
      "Add a valid skills assessment issue date to check the modeled assessment requirement.",
    );
  }
  if (profile.assessmentExpiry && !parseDate(profile.assessmentExpiry)) {
    uncheckedDates.push("assessmentExpiry");
    warnings.push("Skills assessment letter expiry date is invalid.");
  }
  if (assessmentExpiry && today >= assessmentExpiry) {
    ineligibleReasons.push("skills assessment expired");
    warnings.push(
      "Skills assessment has expired (letter expiry or the three-year cap, whichever is earlier).",
    );
  }
  const visaExpiry = parseDate(profile.visaExpiry);
  if (profile.onshore && visaExpiry && visaExpiry <= today)
    warnings.push(
      "The entered visa expiry date is on or before the calculation date; current visa status and any bridging arrangements are not assessed.",
    );
  const eoiDate = parseDate(profile.eoiDate);
  if (eoiDate && addYears(eoiDate, 2) <= today)
    warnings.push(
      "The entered EOI two-year active period has ended; actual SkillSelect status is not checked.",
    );
  const base = categories.reduce((sum, category) => sum + category.points, 0);
  return {
    base,
    subclass190: base + 5,
    subclass491: base + 15,
    categories,
    missing,
    warnings,
    eligible:
      ineligibleReasons.length > 0
        ? false
        : uncheckedDates.length > 0 || missing.length > 0
          ? null
          : true,
    ineligibleReasons,
    uncheckedDates,
  };
}

/** Only dated events supported by the profile, strictly after asOf and within three calendar years. */
export function buildTimeline(profile: Profile, asOf: string): TimelineEvent[] {
  const today = parseDate(asOf);
  if (!today) return [];
  const horizon = addYears(today, 3);
  const events: TimelineEvent[] = [];
  const add = (
    date: Date | null,
    title: string,
    description: string,
    kind: TimelineEvent["kind"],
    delta?: number,
  ) => {
    if (date && date > today && date <= horizon)
      events.push({
        date: iso(date),
        title,
        description,
        kind,
        ...(delta !== undefined ? { delta } : {}),
      });
  };
  const dob = parseDate(profile.dob);
  if (dob && dob <= today)
    for (const birthday of [18, 25, 33, 40, 45]) {
      const delta = agePoints(birthday) - agePoints(birthday - 1);
      add(
        addYears(dob, birthday),
        `Your ${birthday}${birthday === 33 ? "rd" : "th"} birthday`,
        birthday === 45
          ? "Age points end; the modeled under-45 requirement is no longer met."
          : `Age points change from ${agePoints(birthday - 1)} to ${agePoints(birthday)}.`,
        delta > 0 ? "gain" : "loss",
        delta,
      );
    }
  const english = parseDate(profile.englishDate);
  if (english && english <= today && profile.english !== "unknown")
    add(
      addYears(english, 3),
      "English test validity ends",
      "The test reaches the modeled three-year evidence validity limit.",
      "expiry",
      profile.english === "superior"
        ? -20
        : profile.english === "proficient"
          ? -10
          : 0,
    );
  const assessment = parseDate(profile.assessmentDate);
  if (!assessment || assessment <= today)
    add(
      assessmentEnd(profile),
      "Skills assessment validity ends",
      "The earlier of the letter expiry and three years from the assessment date.",
      "expiry",
    );
  add(
    parseDate(profile.visaExpiry),
    "Visa expiry",
    "The visa expiry date entered in this profile; visa conditions and bridging arrangements are outside this estimate.",
    "expiry",
  );
  const eoi = parseDate(profile.eoiDate);
  if (eoi && eoi <= today)
    add(
      addYears(eoi, 2),
      "EOI validity ends",
      "The Expression of Interest reaches two years from the date entered.",
      "expiry",
    );
  const py = parseDate(profile.professionalYearDate);
  if (
    profile.professionalYear &&
    supportsProfessionalYear(profile.occupation) &&
    py &&
    py <= today
  )
    add(
      addYears(py, 4),
      "Professional Year points end",
      "The completion date moves outside the four-year window.",
      "loss",
      -5,
    );
  if (profile.communityLanguage)
    add(
      parseDate(profile.communityLanguageExpiry),
      "Community language credential expires",
      "The entered credential expiry date ends the five points in this estimate.",
      "expiry",
      -5,
    );
  return events.sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  );
}

/** Fixed month names: ICU versions differ (en-GB may print "Sept"). */
export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "2026-10-15" becomes "15 Oct 2026"; an invalid date becomes "—". */
export function formatDate(value: string): string {
  const date = parseDate(value);
  if (!date) return "—";
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
export function localToday(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
