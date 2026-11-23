import { SOURCES } from "../../data/guide/sources";
import type { Visa } from "../data/types";
import {
  addYearsToDate,
  calculatePoints,
  emptyProfile,
  type PointCategory,
  type Profile,
} from "../migration";
import type { FederalList } from "../state-outlook/rules-types";

export type AgeBand =
  "under-18" | "18-24" | "25-32" | "33-39" | "40-44" | "45-plus";

/** The guide's short points questions. Null means unanswered. */
export type QuickAnswers = {
  occupation: string;
  age: AgeBand | null;
  english: "not-yet" | "competent" | "proficient" | "superior" | null;
  qualification: "none" | "trade" | "bachelor" | "doctorate" | null;
  /** Lower bound of the band: 0, 3, 5 or 8 years. */
  overseasYears: number;
  /** Lower bound of the band: 0, 1, 3, 5 or 8 years. */
  australianYears: number;
  partner: "single" | "citizen" | "skilled" | "english" | "none" | null;
  ausStudy: boolean;
  regionalStudy: boolean;
  specialistEducation: boolean;
  professionalYear: boolean;
  communityLanguage: boolean;
  assessment: "positive" | "not-yet" | null;
};

export const EMPTY_ANSWERS: QuickAnswers = {
  occupation: "",
  age: null,
  english: null,
  qualification: null,
  overseasYears: 0,
  australianYears: 0,
  partner: null,
  ausStudy: false,
  regionalStudy: false,
  specialistEducation: false,
  professionalYear: false,
  communityLanguage: false,
  assessment: null,
};

/** "not-yet" is something the reader can still do; "not-met" is a rule they fail. */
export type CheckStatus = "met" | "not-yet" | "not-met" | "unknown";

export type BasicCheck = {
  id: "age" | "english" | "assessment" | "occupation" | "points";
  /** Set for the per-visa checks (occupation list and points). */
  visa?: Visa;
  label: string;
  status: CheckStatus;
  detail: string;
  source: string;
};

export type QuickResult = {
  points: Record<Visa, number>;
  categories: PointCategory[];
  checks: BasicCheck[];
  /** Visas for which every basic checked here is met. Not visa eligibility. */
  visasMeetingBasics: Visa[];
};

const VISAS: Visa[] = ["189", "190", "491"];
const NOMINATION: Record<Visa, number> = { "189": 0, "190": 5, "491": 15 };
// The youngest age in each band, so the band's age points apply.
const BAND_AGE: Record<AgeBand, number> = {
  "under-18": 17,
  "18-24": 18,
  "25-32": 25,
  "33-39": 33,
  "40-44": 40,
  "45-plus": 45,
};
const PASS_MARK = 65;

/** A Profile for `calculatePoints`; dates the guide doesn't ask for stay empty. */
export function quickProfile(answers: QuickAnswers, asOf: string): Profile {
  const dob = answers.age
    ? (addYearsToDate(asOf, -BAND_AGE[answers.age]) ?? "")
    : "";
  const english =
    answers.english === null || answers.english === "not-yet"
      ? "unknown"
      : answers.english;
  return {
    ...emptyProfile,
    dob,
    occupation: answers.occupation,
    english,
    qualification: answers.qualification ?? "unknown",
    overseasYears: answers.overseasYears,
    australianYears: answers.australianYears,
    partner: answers.partner ?? "unknown",
    ausStudy: answers.ausStudy,
    regionalStudy: answers.ausStudy && answers.regionalStudy,
    specialistEducation: answers.specialistEducation,
    professionalYear: answers.professionalYear,
    communityLanguage: answers.communityLanguage,
  };
}

function ageCheck(age: AgeBand | null): BasicCheck {
  const base = {
    id: "age" as const,
    label: "Under 45 when invited",
    source: SOURCES.visa189,
  };
  if (age === null)
    return { ...base, status: "unknown", detail: "Choose your age." };
  if (age === "45-plus")
    return {
      ...base,
      status: "not-met",
      detail: "Home Affairs won't invite anyone aged 45 or over.",
    };
  if (age === "under-18")
    return {
      ...base,
      status: "not-yet",
      detail: "Age points on the points test start at 18.",
    };
  return { ...base, status: "met", detail: "Your age is under 45." };
}

function englishCheck(english: QuickAnswers["english"]): BasicCheck {
  const base = {
    id: "english" as const,
    label: "At least competent English",
    source: SOURCES.competentEnglish,
  };
  if (english === null)
    return { ...base, status: "unknown", detail: "Choose your English level." };
  if (english === "not-yet")
    return {
      ...base,
      status: "not-yet",
      detail: "You need a test result at competent or above when invited.",
    };
  return { ...base, status: "met", detail: "Your English level counts." };
}

function assessmentCheck(assessment: QuickAnswers["assessment"]): BasicCheck {
  const base = {
    id: "assessment" as const,
    label: "A suitable skills assessment",
    source: SOURCES.skillsAssessment,
  };
  if (assessment === null)
    return { ...base, status: "unknown", detail: "Tell us about it." };
  if (assessment === "not-yet")
    return {
      ...base,
      status: "not-yet",
      detail:
        "You need one from the assessing authority listed for your occupation by the time you're invited.",
    };
  return {
    ...base,
    status: "met",
    detail: "It must be under 3 years old when you're invited.",
  };
}

function occupationCheck(
  visa: Visa,
  code: string,
  federal: FederalList | null,
): BasicCheck {
  const base = {
    id: "occupation" as const,
    visa,
    label: `Occupation on the ${visa} list`,
    source: SOURCES.occupationList,
  };
  if (!code)
    return { ...base, status: "unknown", detail: "Choose your occupation." };
  if (!federal)
    return {
      ...base,
      status: "unknown",
      detail: "We couldn't read the Home Affairs list.",
    };
  return federal.entries[code]?.[visa]
    ? { ...base, status: "met", detail: `Listed for ${visa}.` }
    : { ...base, status: "not-met", detail: `Not listed for ${visa}.` };
}

function pointsCheck(
  visa: Visa,
  points: number,
  answered: boolean,
): BasicCheck {
  const base = {
    id: "points" as const,
    visa,
    label:
      visa === "189"
        ? "65 points for 189"
        : `65 points for ${visa}, with +${NOMINATION[visa]} for nomination`,
    source: SOURCES.pointsTable,
  };
  if (!answered)
    return {
      ...base,
      status: "unknown",
      detail: "Answer the points questions.",
    };
  return points >= PASS_MARK
    ? { ...base, status: "met", detail: `${points} points.` }
    : {
        ...base,
        status: "not-met",
        detail: `${points} points: ${PASS_MARK - points} short.`,
      };
}

/** Points from the site's calculation and the basic federal requirements. */
export function quickCheck(
  answers: QuickAnswers,
  asOf: string,
  federal: FederalList | null,
): QuickResult {
  const result = calculatePoints(quickProfile(answers, asOf), asOf);
  const points = {
    "189": result.base,
    "190": result.base + NOMINATION["190"],
    "491": result.base + NOMINATION["491"],
  };
  const answered =
    answers.age !== null &&
    answers.english !== null &&
    answers.qualification !== null &&
    answers.partner !== null;
  const shared = [
    ageCheck(answers.age),
    englishCheck(answers.english),
    assessmentCheck(answers.assessment),
  ];
  const perVisa = VISAS.flatMap((visa) => [
    occupationCheck(visa, answers.occupation, federal),
    pointsCheck(visa, points[visa], answered),
  ]);
  const checks = [...shared, ...perVisa];
  const visasMeetingBasics = VISAS.filter((visa) =>
    checks
      .filter((c) => c.visa === undefined || c.visa === visa)
      .every((c) => c.status === "met"),
  );
  return {
    points,
    categories: result.categories,
    checks,
    visasMeetingBasics,
  };
}
