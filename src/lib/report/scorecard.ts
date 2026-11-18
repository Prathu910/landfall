import { invitationActivity } from "../data/invitations";
import { poolPosition } from "../data/pool-position";
import { monthEnd } from "../data/report-source";
import type {
  MonthKey,
  OccupationCore,
  OccupationDetail,
  Visa,
} from "../data/types";
import { formatDate } from "../migration";
import { countPhrase, formatCount, formatMonth } from "./copy";
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
  ahead: string | null;
  atScore: string | null;
  href: string;
};
export type Scorecard = {
  headline: string;
  sourceLine: string;
  cards: [ScorecardCard, ScorecardCard, ScorecardCard];
  overlapNote: string;
};

type Points = { base: number; subclass190: number; subclass491: number };
type Chip = ScorecardCard["chip"];

const INVITATION_WINDOW_MONTHS = 12;
export const LOADING_HEADLINE = "Loading published data…";
const NO_DATA_SENTENCE = "No published data to compare for this occupation.";
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
const POINTS_NOTES: Record<Visa, string | null> = {
  "189": null,
  "190": "with +5 if nominated",
  "491": "with +15 if nominated or sponsored",
};

function stateSentence(core: OccupationCore, visa: Visa): string {
  const activity = invitationActivity(core, visa, INVITATION_WINDOW_MONTHS);
  if (activity.lastConfirmedMonth) {
    const month = activity.months.find(
      (m) => m.asAt === activity.lastConfirmedMonth,
    );
    const count = formatCount({
      min: month?.invitedAtLeast.min ?? 0,
      max: month?.invitedAtLeast.min ?? 0,
    });
    return `At least ${count} invited as at ${formatMonth(activity.lastConfirmedMonth)}, across all states. Each state selects by its own rules.`;
  }
  if (activity.lastPossibleMonth) {
    return "Invitations recorded in the last 12 months are each under 20, so may be zero.";
  }
  return `No ${visa} invitations recorded for this occupation in the last 12 months.`;
}

function cutoffText(
  value: { date: string; cutoff: number } | null,
): string | null {
  return value
    ? `${value.cutoff} points, ${formatMonth(value.date.slice(0, 7))}`
    : null;
}

function headlineFor(name: string, data: ScorecardData, base: number): string {
  if (data.kind === "none") {
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

function buildCard(
  visa: Visa,
  points: number,
  data: ScorecardData,
  submittedMonth: MonthKey | null,
): ScorecardCard {
  const base = {
    visa,
    title: TITLES[visa],
    points,
    pointsNote: POINTS_NOTES[visa],
    href: `#visa-${visa}`,
  };
  if (data.kind === "none") {
    return {
      ...base,
      chip:
        visa === "189"
          ? { label: "No data", tone: "neutral" }
          : { label: "State decides", tone: "neutral" },
      sentence: NO_DATA_SENTENCE,
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
      : {
          chip: { label: "State decides", tone: "amber" } as Chip,
          sentence: stateSentence(data.core, visa),
        };
  return { ...base, chip, sentence, ...counts };
}

export function buildScorecard(input: {
  occupationName: string;
  data: ScorecardData;
  points: Points;
  submittedMonth: MonthKey | null;
}): Scorecard {
  const { occupationName, data, points, submittedMonth } = input;
  const cards: Scorecard["cards"] = [
    buildCard("189", points.base, data, submittedMonth),
    buildCard("190", points.subclass190, data, submittedMonth),
    buildCard("491", points.subclass491, data, submittedMonth),
  ];
  return {
    headline: headlineFor(occupationName, data, points.base),
    sourceLine:
      data.kind === "ready"
        ? `Source: SkillSelect, Department of Home Affairs · snapshot ${formatDate(monthEnd(data.core.asAt))} · counts are EOIs (one person can hold several).`
        : "Source: SkillSelect, Department of Home Affairs.",
    cards,
    overlapNote: "One EOI can select several visas, so pools overlap.",
  };
}
