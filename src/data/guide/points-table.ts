import { GUIDE_CHECKED_AT, SOURCES } from "./sources";

// The Home Affairs points table for the 189, 190 and 491, read on
// GUIDE_CHECKED_AT (docs/research/pr-guide-2026-11.md; the 189 page was last
// updated 4 Nov 2026). The three visas share one table; only the nomination
// row differs. `src/data/guide/points-table.test.ts` proves calculatePoints
// gives every row's points, so the page and the calculator can't drift.
// A reform was announced in the 2026–27 Budget, but no new table had been
// published (points-changes.ts): re-read the table when one is.

export type PointsRow = {
  id: string;
  /** What earns the points, as the table words it. */
  band: string;
  points: number;
};

export type PointsFactorId =
  | "age"
  | "english"
  | "employment"
  | "qualification"
  | "extras"
  | "partner"
  | "nomination";

export type PointsFactor = {
  id: PointsFactorId;
  /** The factor's name in the table. */
  factor: string;
  /** The page's question-shaped heading for this factor. */
  question: string;
  /** One sentence above the table: the rule that the rows don't show. */
  note: string;
  rows: PointsRow[];
  source: string;
  checkedAt: string;
};

/** The pass mark every points-tested skilled visa uses. */
export const PASS_MARK = 65;

const factor = (f: Omit<PointsFactor, "source" | "checkedAt">) => ({
  ...f,
  source: SOURCES.pointsTable,
  checkedAt: GUIDE_CHECKED_AT,
});

export const POINTS_TABLE: PointsFactor[] = [
  factor({
    id: "age",
    factor: "Age",
    question: "How many points do I get for age?",
    note: "Your age on the day you are invited. At 45 or over you can’t be invited for a points-tested skilled visa.",
    rows: [
      { id: "age-18-24", band: "18 to 24", points: 25 },
      { id: "age-25-32", band: "25 to 32", points: 30 },
      { id: "age-33-39", band: "33 to 39", points: 25 },
      { id: "age-40-44", band: "40 to 44", points: 15 },
    ],
  }),
  factor({
    id: "english",
    factor: "English language",
    question: "How many points is Proficient or Superior English?",
    note: "Competent English is the minimum to be invited and earns no points.",
    rows: [
      { id: "english-competent", band: "Competent English", points: 0 },
      { id: "english-proficient", band: "Proficient English", points: 10 },
      { id: "english-superior", band: "Superior English", points: 20 },
    ],
  }),
  factor({
    id: "employment",
    factor: "Skilled employment",
    question: "How are work experience points capped?",
    note: "Skilled employment in the 10 years before the invitation. Overseas and Australian points are added together, up to 20 in total.",
    rows: [
      { id: "overseas-3", band: "Outside Australia, 3 to 4 years", points: 5 },
      { id: "overseas-5", band: "Outside Australia, 5 to 7 years", points: 10 },
      {
        id: "overseas-8",
        band: "Outside Australia, 8 to 10 years",
        points: 15,
      },
      { id: "australia-1", band: "In Australia, 1 to 2 years", points: 5 },
      { id: "australia-3", band: "In Australia, 3 to 4 years", points: 10 },
      { id: "australia-5", band: "In Australia, 5 to 7 years", points: 15 },
      { id: "australia-8", band: "In Australia, 8 to 10 years", points: 20 },
      {
        id: "employment-cap",
        band: "Most for overseas and Australian employment combined",
        points: 20,
      },
    ],
  }),
  factor({
    id: "qualification",
    factor: "Educational qualifications",
    question: "How many points do qualifications give?",
    note: "Only your highest qualification counts. Specialist education is extra, on top of it.",
    rows: [
      {
        id: "doctorate",
        band: "Doctorate from an Australian institution, or one recognised as of that standard",
        points: 20,
      },
      {
        id: "bachelor",
        band: "Bachelor (or higher) degree from an Australian institution, or one recognised as of that standard",
        points: 15,
      },
      {
        id: "diploma",
        band: "Diploma or trade qualification completed in Australia, or a qualification your assessing authority recognises for your occupation",
        points: 10,
      },
      {
        id: "specialist",
        band: "Specialist education: a master’s by research or a doctorate from an Australian institution in a STEM field, with at least 2 academic years of study",
        points: 10,
      },
    ],
  }),
  factor({
    id: "extras",
    factor: "Australian study and other credentials",
    question: "What gives 5 extra points?",
    note: "Each of these adds 5 points, and they add up. Regional study counts only with the Australian study requirement met.",
    rows: [
      {
        id: "australian-study",
        band: "Australian study requirement: at least 2 academic years of study in Australia",
        points: 5,
      },
      {
        id: "regional-study",
        band: "Study in regional Australia, while meeting the Australian study requirement",
        points: 5,
      },
      {
        id: "professional-year",
        band: "Professional Year in Australia (ICT, engineering or accounting), completed in the 4 years before the invitation",
        points: 5,
      },
      {
        id: "community-language",
        band: "Credentialled community language (NAATI CCL)",
        points: 5,
      },
    ],
  }),
  factor({
    id: "partner",
    factor: "Partner skills",
    question: "How many points does a partner add?",
    note: "Points for your partner’s skills, or for having no partner who could count.",
    rows: [
      {
        id: "partner-single",
        band: "No partner, or your partner is an Australian citizen or permanent resident",
        points: 10,
      },
      {
        id: "partner-skilled",
        band: "Partner under 45 with competent English, a suitable skills assessment and an occupation on the same list as yours",
        points: 10,
      },
      {
        id: "partner-english",
        band: "Partner with competent English only",
        points: 5,
      },
    ],
  }),
  factor({
    id: "nomination",
    factor: "Nomination or sponsorship",
    question: "How many points does state nomination add?",
    note: "These points come with the visa, not your profile: the 189 has none.",
    rows: [
      {
        id: "nomination-190",
        band: "190: nomination by a state or territory",
        points: 5,
      },
      {
        id: "nomination-491",
        band: "491: nomination by a state or territory, or sponsorship by an eligible relative in a designated regional area",
        points: 15,
      },
    ],
  }),
];
