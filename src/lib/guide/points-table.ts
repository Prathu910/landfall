import {
  PASS_MARK,
  type PointsFactor,
  type PointsFactorId,
} from "../../data/guide/points-table";
import { formatDate } from "../migration";
import {
  articleLd,
  breadcrumbLd,
  faqPageLd,
  type FaqEntry,
} from "../seo/json-ld";
import { SITE_NAME, SITE_URL } from "../site";
import { latestRoundSentence, type LatestRound } from "../updates/latest-round";
import { GUIDE_PAGES } from "./meta";

/**
 * The /guide/points-table/ page (audit A-P1-5): the points test as tables,
 * an answer-first opening and questions, every figure read from the
 * hand-sourced table in src/data/guide/points-table.ts.
 */
export const POINTS_TABLE_PAGE = {
  path: "/guide/points-table/",
  title: "Australian PR points table (189, 190 and 491)",
  description:
    "The Australian points test as a table: points for age, English, work, qualifications, study, partner and nomination for the 189, 190 and 491 visas.",
  heading: "The Australian points table for the 189, 190 and 491",
  crumb: "Points table",
  /** The day the page was first published (Article datePublished). */
  publishedAt: "2026-11-26",
} as const;

function find(table: PointsFactor[], id: PointsFactorId): PointsFactor {
  const factor = table.find((f) => f.id === id);
  if (!factor) throw new Error(`The points table has no ${id} factor`);
  return factor;
}

const top = (factor: PointsFactor) =>
  factor.rows.reduce((best, row) => (row.points > best.points ? row : best));

const points = (table: PointsFactor[], rowId: string): number => {
  const row = table.flatMap((f) => f.rows).find((r) => r.id === rowId);
  if (!row) throw new Error(`The points table has no ${rowId} row`);
  return row.points;
};

/** The dated answer that opens the page; every number from the table. */
export function pointsTableAnswer(table: PointsFactor[]): string {
  const checked = formatDate(table[0].checkedAt);
  const age = top(find(table, "age"));
  const english = top(find(table, "english"));
  const employmentCap = points(table, "employment-cap");
  const qualification = top(find(table, "qualification"));
  return `As at ${checked}, the Australian points test for the 189, 190 and 491 has a pass mark of ${PASS_MARK} points. Age gives up to ${age.points} points (${age.band}), English up to ${english.points} (Superior), skilled employment up to ${employmentCap} combined and qualifications up to ${qualification.points} (a doctorate); state nomination adds ${points(table, "nomination-190")} for the 190 or ${points(table, "nomination-491")} for the 491. Source: Home Affairs points table, checked ${checked}.`;
}

/** The page's questions; the 189 answer adds the latest round's figures. */
export function pointsTableFaq(
  table: PointsFactor[],
  round: LatestRound | null,
): FaqEntry[] {
  const english = find(table, "english");
  const employmentCap = points(table, "employment-cap");
  const roundFigures = round ? ` ${latestRoundSentence(round)}` : "";
  return [
    {
      question: "What is the pass mark for Australian PR?",
      answer: `${PASS_MARK} points, for the 189, 190 and 491. It is the minimum to be invited, not a promise of an invitation.${roundFigures}`,
    },
    {
      question: "Is the points table the same for the 189, 190 and 491?",
      answer: `Yes. The three visas use one points table; only nomination differs. The 190 adds ${points(table, "nomination-190")} points for state nomination, the 491 adds ${points(table, "nomination-491")} for state nomination or family sponsorship, and the 189 adds none.`,
    },
    {
      question: "How many points is Superior English?",
      answer: english.rows
        .map((row) => `${row.band}: ${row.points} points`)
        .join("; ")
        .concat("."),
    },
    {
      question: "Can work experience give more than 20 points?",
      answer: `No. Overseas and Australian skilled employment are added together and capped at ${employmentCap} points.`,
    },
    {
      question: "Do I get points for both a degree and a doctorate?",
      answer: `No. Only your highest qualification counts (${points(table, "doctorate")} points for a doctorate, ${points(table, "bachelor")} for a bachelor degree). Specialist education adds ${points(table, "specialist")} on top of it.`,
    },
  ];
}

/** Article, FAQ and breadcrumbs (MigrateLens › PR guide › Points table). */
export function pointsTableJsonLd(
  faq: FaqEntry[],
  checkedAt: string,
  citations: string[],
): object[] {
  const url = SITE_URL + POINTS_TABLE_PAGE.path;
  return [
    articleLd({
      headline: POINTS_TABLE_PAGE.heading,
      description: POINTS_TABLE_PAGE.description,
      url,
      datePublished: POINTS_TABLE_PAGE.publishedAt,
      dateModified: checkedAt,
      citations,
    }),
    faqPageLd(faq),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: GUIDE_PAGES.hub.crumb, item: SITE_URL + GUIDE_PAGES.hub.path },
      { name: POINTS_TABLE_PAGE.crumb, item: url },
    ]),
  ];
}

export type PointsInBrief = { factor: string; points: string };

/** The table in one line per factor, for the /check/ explainer. */
export function pointsInBrief(table: PointsFactor[]): PointsInBrief[] {
  const most = (id: PointsFactorId) => `Up to ${top(find(table, id)).points}`;
  const extras = find(table, "extras").rows;
  return [
    { factor: "Age", points: most("age") },
    { factor: "English", points: most("english") },
    {
      factor: "Skilled employment",
      points: `Up to ${points(table, "employment-cap")} combined`,
    },
    {
      factor: "Qualifications",
      points: `Up to ${points(table, "doctorate")}, plus ${points(table, "specialist")} for specialist education`,
    },
    {
      factor: "Australian study, regional study, Professional Year, NAATI CCL",
      points: `${extras[0].points} each`,
    },
    { factor: "Partner", points: most("partner") },
    {
      factor: "Nomination",
      points: `${points(table, "nomination-190")} (190) or ${points(table, "nomination-491")} (491)`,
    },
  ];
}
