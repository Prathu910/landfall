import type { PointCategory } from "../migration";
import { countInSentence } from "../report/copy";
import type { ReportView } from "../report/report-view";
import type { Group } from "../state-outlook/outlook";
import {
  OPEN_OVERVIEW,
  START_OVER,
  TRY_SAMPLE_ANSWERS,
} from "../check-actions";
import type { Visa } from "../data/types";
import { AT_SCORE_LABEL, POINTS_UNIT } from "../report/scorecard";

export type DemoContent = {
  occupation: string;
  points: string;
  profileLines: string[];
  /** Each visa at its own points (190 and 491 include nomination points). */
  cards: {
    visa: Visa;
    /** The report's card title, e.g. "190 · Nominated". */
    title: string;
    points: string;
    aheadLabel: string;
    ahead: string;
    atScore: string;
  }[];
  /** `tone` is the outlook group, which picks the report's status colour. */
  tiles: { state: string; tone: Group; group: string; label: string }[];
  labels: typeof DEMO_LABELS;
  /** One plain sentence for the payoff, built from the same strings. */
  posterAlt: string;
};

/**
 * The stage's few interface words, each as the product already says it: the
 * check's buttons and the report's scorecard.
 */
const DEMO_LABELS = {
  atScore: AT_SCORE_LABEL,
  pointsUnit: POINTS_UNIT,
  startOver: START_OVER,
  trySample: TRY_SAMPLE_ANSWERS,
  openOverview: OPEN_OVERVIEW,
} as const;

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`The demo needs ${what}`);
  return value;
}

/**
 * Strings for the homepage demo, in the order it shows them. They all come
 * from the report's own view-models, so the demo can never disagree with the
 * sample report.
 */
export function buildDemoContent(
  view: ReportView,
  occupationName: string,
  points: number,
  categories: PointCategory[],
): DemoContent {
  const outlook = required(view.stateOutlook, "the state outlook");
  const cards = view.scorecard.cards.map((card) => ({
    visa: card.visa,
    title: card.title,
    points: String(card.points),
    aheadLabel: card.aheadLabel,
    ahead: required(card.ahead, `${card.title} counts`),
    atScore: required(card.atScore, `${card.title} counts`),
  }));
  const panels = outlook.panelsByVisa["190"];
  const tiles = outlook.tilesByVisa["190"].map((tile) => ({
    state: tile.state,
    tone: tile.group,
    group: required(
      panels.find((p) => p.id === tile.href.slice(1))?.groupLabel ?? null,
      `a group label for ${tile.label}`,
    ),
    label: tile.label,
  }));
  const profileLines = [
    ...categories
      .filter((c) => c.points > 0)
      .map((c) => `${c.label} · ${c.points} pts`),
    `${points} ${POINTS_UNIT}`,
  ];
  // Typed intervals, so a masked count keeps its "may be zero" wording.
  const stand = view.panels?.whereYouStand;
  if (!stand || !("segments" in stand)) {
    throw new Error("The demo needs the 189 where-you-stand counts");
  }
  const { ahead, same } = stand.segments;
  return {
    occupation: occupationName,
    points: String(points),
    profileLines,
    cards,
    tiles,
    labels: DEMO_LABELS,
    posterAlt: `${occupationName} at ${points} points: ${countInSentence(ahead)} EOIs with a higher score for 189 and ${countInSentence(same)} at the same score.`,
  };
}
