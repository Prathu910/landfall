import type { PointCategory } from "../migration";
import { countInSentence } from "../report/copy";
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
  const profileLines = [
    ...categories
      .filter((c) => c.points > 0)
      .map((c) => `${c.label} · ${c.points} pts`),
    `${points} points`,
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
    posterAlt: `${occupationName} at ${points} points: ${countInSentence(ahead)} EOIs with a higher score for 189 and ${countInSentence(same)} at the same score.`,
  };
}
