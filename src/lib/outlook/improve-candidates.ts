import type { Profile } from "../migration";
import { applyScenarios } from "../scenarios";
import { expiredItems } from "./eligibility";

export type MoveId =
  | "english-proficient"
  | "english-superior"
  | "english-retake"
  | "assessment-renewal"
  | "naati"
  | "professional-year"
  | "partner-skills"
  | "experience"
  | "combined";
export type SingleId = Exclude<MoveId, "combined">;

export type Candidate = {
  id: SingleId;
  name: string;
  /** The name as it reads mid-sentence. */
  phrase?: string;
  detail: string;
  apply: (profile: Profile) => Profile;
};

// The profile holds years, not dates, so "shortest time" uses typical lead
// times: one test, then an English result, then longer steps.
export const LEAD_TIME: Record<MoveId, number> = {
  naati: 0,
  "english-retake": 1,
  "english-proficient": 1,
  "english-superior": 2,
  "assessment-renewal": 3,
  "partner-skills": 3,
  "professional-year": 4,
  experience: 5,
  combined: 6,
};
export const ENGLISH_MOVES: SingleId[] = [
  "english-proficient",
  "english-superior",
  "english-retake",
];

/** The next experience band; applyScenarios leaves 8+ years unchanged. */
function experienceCandidate(profile: Profile, asOf: string): Candidate {
  // Onshore readers are building Australian experience; others overseas.
  const band = profile.onshore ? "australian-work" : "overseas-work";
  const next = applyScenarios(profile, [band], asOf);
  const years = profile.onshore ? next.australianYears : next.overseasYears;
  const where = profile.onshore ? "Australian" : "overseas";
  const unit = years === 1 ? "year" : "years";
  const possessive = years === 1 ? "year's" : "years'";
  return {
    id: "experience",
    name: `${years} ${possessive} ${where} experience`,
    detail: `Happens on its own when you reach ${years} ${unit}.`,
    apply: (p) => applyScenarios(p, [band], asOf),
  };
}

/**
 * Changes that restore an expired basic requirement. A Competent retake adds
 * no points, so only these two can matter without a points gain; a higher
 * English band already counts as a retake.
 */
function restoreCandidates(
  profile: Profile,
  asOf: string,
  reasons: string[],
): Candidate[] {
  const expired = expiredItems(reasons);
  const list: Candidate[] = [];
  if (expired.includes("English test") && profile.english === "competent") {
    list.push({
      id: "english-retake",
      name: "English retake",
      phrase: "an English retake",
      detail:
        "A new English test at Competent level, because yours has expired.",
      apply: (p) => ({ ...p, englishDate: asOf }),
    });
  }
  if (expired.includes("skills assessment")) {
    list.push({
      id: "assessment-renewal",
      name: "Skills assessment renewal",
      phrase: "a skills assessment renewal",
      detail: "A new skills assessment, because yours has expired.",
      apply: (p) => ({ ...p, assessmentDate: asOf, assessmentExpiry: "" }),
    });
  }
  return list;
}

/** Every move to try; the caller keeps those that add points or lift the label. */
export function candidates(
  profile: Profile,
  asOf: string,
  reasons: string[],
): Candidate[] {
  const scenario = (id: string) => (p: Profile) =>
    applyScenarios(p, [id], asOf);
  const list: Candidate[] = [
    {
      id: "english-proficient",
      name: "Proficient English",
      detail: "A new English test result at Proficient level.",
      apply: (p) => ({ ...p, english: "proficient", englishDate: asOf }),
    },
    {
      id: "english-superior",
      name: "Superior English",
      detail: "A new English test result at Superior level.",
      apply: scenario("english"),
    },
    ...restoreCandidates(profile, asOf, reasons),
    {
      id: "naati",
      name: "NAATI CCL test",
      detail: "One test in a community language.",
      apply: scenario("language"),
    },
    // calculatePoints decides which occupations a Professional Year counts for.
    {
      id: "professional-year",
      name: "Professional Year",
      detail: "A Professional Year program in your field, about 12 months.",
      apply: (p) => ({
        ...p,
        professionalYear: true,
        professionalYearDate: "",
      }),
    },
  ];
  if (profile.partner === "english") {
    list.push({
      id: "partner-skills",
      name: "Partner skills assessment",
      phrase: "your partner's skills assessment",
      detail: "Partner points go from 5 to 10.",
      apply: (p) => ({ ...p, partner: "skilled" }),
    });
  }
  return [...list, experienceCandidate(profile, asOf)];
}
