import { poolPosition } from "../data/pool-position";
import { monthEnd } from "../data/report-source";
import type {
  MonthKey,
  OccupationCore,
  OccupationDetail,
  StateVisa,
  Visa,
} from "../data/types";
import { formatDate } from "../migration";
import { formatCount, formatMonth, QUEUE_NOTE, type LinkedNote } from "./copy";
import {
  CHIP_LABEL,
  summarise189Rounds,
  type RoundStatus,
} from "./round-status";

export type ScorecardData =
  | { kind: "ready"; core: OccupationCore; detail: OccupationDetail | null }
  | {
      kind: "none";
      reason: "notIndexed" | "noData" | "loadFailed" | "loading";
    };
export type Tone = "red" | "amber" | "green" | "neutral";
export type ScorecardCard = {
  visa: Visa;
  title: string;
  chip: { label: string; tone: Tone };
  sentence: string;
  points: number;
  pointsNote: string | null;
  aheadLabel: string;
  ahead: string | null;
  atScore: string | null;
  href: string | null; // null: no visa panel renders without data
};
export type Scorecard = {
  headline: string;
  sourceLine: string;
  cards: [ScorecardCard, ScorecardCard, ScorecardCard];
  /** Null when no card shows a higher-score count. */
  queueNote: LinkedNote | null;
  overlapNote: string;
};

type Points = { base: number; subclass190: number; subclass491: number };
/** Each nominated visa's state outlook summary; null without occupation data. */
type StateSummaries = Record<StateVisa, string> | null;
type Chip = ScorecardCard["chip"];
type NoneReason = Extract<ScorecardData, { kind: "none" }>["reason"];

export const LOADING_HEADLINE = "Loading published data…";
const NO_DATA_SENTENCE = "No published data to compare for this occupation.";
const LOAD_FAILED_SENTENCE = "Published data could not be loaded.";
const POINTS_ONLY_SENTENCE = "Points check only.";
const STATE_DECIDES_NEUTRAL: Chip = { label: "State decides", tone: "neutral" };
const STATUS_TONE: Record<RoundStatus, Tone> = {
  none: "red",
  occasional: "amber",
  regular: "green",
};
const TITLES: Record<Visa, string> = {
  "189": "189 · Independent",
  "190": "190 · Nominated",
  "491": "491 · Regional",
};
// 190/491 counts are national: a state's selection is not a queue.
const AHEAD_LABELS: Record<Visa, string> = {
  "189": "Ahead of you",
  "190": "Higher score (national pool)",
  "491": "Higher score (national pool)",
};
const POINTS_NOTES: Record<Visa, string | null> = {
  "189": null,
  "190": "with +5 if nominated",
  "491": "with +15 if nominated or sponsored",
};

function cutoffText(
  value: { date: string; cutoff: number } | null,
): string | null {
  return value
    ? `${value.cutoff} points, ${formatMonth(value.date.slice(0, 7))}`
    : null;
}

function headlineFor(name: string, data: ScorecardData, base: number): string {
  if (data.kind === "none") {
    if (data.reason === "notIndexed") {
      return "You chose a points check only, so there is no occupation data to compare. Your points breakdown is below.";
    }
    // A failed fetch is a network fact, not a finding about the dataset.
    if (data.reason === "loadFailed") {
      return `Published data for ${name} could not be loaded. Your points breakdown is below.`;
    }
    return data.reason === "loading"
      ? LOADING_HEADLINE
      : `Published SkillSelect data for ${name} is too limited to compare. Your points breakdown is below.`;
  }
  const { pool, rounds189 } = data.core;
  if (!pool["189"] && !pool["190"] && !pool["491"]) {
    return `Published SkillSelect data for ${name} is too limited to compare. Your points breakdown is below.`;
  }
  const summary = summarise189Rounds(rounds189);
  const cutoff = summary.latestCutoffInLastFour?.cutoff;
  if (summary.status === "none" || cutoff === undefined) {
    return `189 hasn't listed ${name} in its last four rounds. Your 190 and 491 prospects depend on state nomination.`;
  }
  const listed =
    summary.status === "regular"
      ? "was listed in each of the last four 189 rounds"
      : `was listed in ${summary.listedInLastFour} of the last four 189 rounds`;
  return `${name} ${listed}. The latest published cut-off was ${cutoff} points; you have ${base}.`;
}

function card189Parts(core: OccupationCore): { chip: Chip; sentence: string } {
  const summary = summarise189Rounds(core.rounds189);
  const chip = {
    label: CHIP_LABEL[summary.status],
    tone: STATUS_TONE[summary.status],
  };
  if (!core.pool["189"]) {
    return {
      chip,
      sentence:
        "No 189 EOIs are published for this occupation in this snapshot.",
    };
  }
  if (summary.status === "none") {
    const last = cutoffText(summary.latestCutoff);
    return {
      chip,
      sentence: last
        ? `Not listed in the last 4 rounds. Last cut-off: ${last}.`
        : "Not listed in any round we can read.",
    };
  }
  return {
    chip,
    sentence: `Listed in ${summary.listedInLastFour} of the last 4 rounds. Latest cut-off: ${cutoffText(summary.latestCutoffInLastFour)}.`,
  };
}

/** A card without occupation data: say why, never imply a finding. */
function noneCardParts(
  visa: Visa,
  reason: NoneReason,
): { chip: Chip; sentence: string } {
  if (reason === "notIndexed") {
    return {
      chip: { label: "Points only", tone: "neutral" },
      sentence: POINTS_ONLY_SENTENCE,
    };
  }
  const failed = reason === "loadFailed";
  const chip: Chip =
    visa === "189"
      ? { label: failed ? "Not loaded" : "No data", tone: "neutral" }
      : STATE_DECIDES_NEUTRAL;
  return {
    chip,
    sentence: failed ? LOAD_FAILED_SENTENCE : NO_DATA_SENTENCE,
  };
}

/** The 190/491 sentence is the state outlook's summary (ruling S1 retired). */
function nominatedCardParts(
  visa: StateVisa,
  summaries: StateSummaries,
): { chip: Chip; sentence: string } {
  if (summaries === null) {
    throw new Error(
      `The ${visa} card needs the state outlook summaries when occupation data is ready`,
    );
  }
  return {
    chip: { label: "State decides", tone: "amber" },
    sentence: summaries[visa],
  };
}

function buildCard(
  visa: Visa,
  points: number,
  data: ScorecardData,
  submittedMonth: MonthKey | null,
  summaries: StateSummaries,
): ScorecardCard {
  const base = {
    visa,
    title: TITLES[visa],
    points,
    pointsNote: POINTS_NOTES[visa],
    aheadLabel: AHEAD_LABELS[visa],
  };
  if (data.kind === "none") {
    return {
      ...base,
      href: null,
      ...noneCardParts(visa, data.reason),
      ahead: null,
      atScore: null,
    };
  }
  const position = poolPosition(
    data.core,
    data.detail,
    visa,
    points,
    submittedMonth,
  );
  const counts = position.available
    ? {
        ahead: formatCount(position.higher),
        atScore: formatCount(position.same),
      }
    : { ahead: null, atScore: null };
  const { chip, sentence } =
    visa === "189"
      ? card189Parts(data.core)
      : nominatedCardParts(visa, summaries);
  return { ...base, chip, sentence, ...counts, href: `#visa-${visa}` };
}

export function buildScorecard(input: {
  occupationName: string;
  data: ScorecardData;
  points: Points;
  submittedMonth: MonthKey | null;
  stateSummaries: StateSummaries;
}): Scorecard {
  const { occupationName, data, points, submittedMonth, stateSummaries } =
    input;
  const cards: Scorecard["cards"] = [
    buildCard("189", points.base, data, submittedMonth, stateSummaries),
    buildCard("190", points.subclass190, data, submittedMonth, stateSummaries),
    buildCard("491", points.subclass491, data, submittedMonth, stateSummaries),
  ];
  return {
    headline: headlineFor(occupationName, data, points.base),
    sourceLine:
      data.kind === "ready"
        ? `Source: SkillSelect, Department of Home Affairs · snapshot ${formatDate(monthEnd(data.core.asAt))} · counts are EOIs (one person can hold several).`
        : "Source: SkillSelect, Department of Home Affairs.",
    cards,
    queueNote: cards.some((card) => card.ahead) ? QUEUE_NOTE : null,
    overlapNote: "One EOI can select several visas, so pools overlap.",
  };
}
