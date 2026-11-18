import { countInSentence, formatCount } from "../report/copy";
import type { ReportView } from "../report/report-view";

export type DemoContent = {
  occupation: string;
  points: string;
  profileLines: string[];
  cards: { visa: string; ahead: string; atScore: string }[];
  tiles: { state: string; group: string; label: string }[];
  /** One plain sentence for the payoff, built from the same strings. */
  posterAlt: string;
};

const MASKED = { min: 0, max: 19 };

/** A masked count keeps its "may be zero" wording wherever it is quoted. */
function inSentence(count: string): string {
  return count === formatCount(MASKED) ? countInSentence(MASKED) : count;
}

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
): DemoContent {
  const outlook = required(view.stateOutlook, "the state outlook");
  const cards = view.scorecard.cards.map((card) => ({
    visa: card.title,
    ahead: required(card.ahead, `${card.title} counts`),
    atScore: required(card.atScore, `${card.title} counts`),
  }));
  const panels = outlook.panelsByVisa["190"];
  const tiles = outlook.tilesByVisa["190"].map((tile) => ({
    state: tile.state,
    group: required(
      panels.find((p) => p.id === tile.href.slice(1))?.groupLabel ?? null,
      `a group label for ${tile.label}`,
    ),
    label: tile.label,
  }));
  const profileLines = view.scorecard.cards.map((card) =>
    card.pointsNote
      ? `${card.title}: ${card.points} points, ${card.pointsNote}`
      : `${card.title}: ${card.points} points`,
  );
  const [first, second] = cards;
  return {
    occupation: occupationName,
    points: String(points),
    profileLines: [occupationName, ...profileLines],
    cards,
    tiles,
    posterAlt: `${occupationName} at ${points} points: ${inSentence(first.ahead)} EOIs with a higher score for 189 and ${inSentence(first.atScore)} at the same score, with ${inSentence(second.ahead)} EOIs with a higher score nationally for 190.`,
  };
}
