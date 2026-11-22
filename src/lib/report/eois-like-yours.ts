import { cohortOutcomes } from "../data/cohorts";
import { calendarMonths, cohortWindowStart } from "../data/months";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  OccupationDetail,
} from "../data/types";
import {
  afterSnapshotText,
  countInSentence,
  formatCount,
  formatMonth,
  formatSummed,
} from "./copy";

export type CohortRow = {
  month: MonthKey;
  label: string;
  invited: string;
  lodged: string;
  waiting: string;
  closed: string;
  isYours: boolean;
};

type Bar = {
  invited: Interval;
  lodged: Interval;
  waiting: Interval;
  closed: Interval;
};

/** One outcome in the key: the bar's four, plus on hold when it isn't zero. */
export type OutcomeRow = {
  key: keyof Bar | "hold";
  label: string;
  count: string;
  interval: Interval;
};

export const OUTCOME_LABELS: Record<OutcomeRow["key"], string> = {
  invited: "Invited, not yet lodged",
  lodged: "Lodged a visa",
  waiting: "Still waiting",
  closed: "Closed",
  hold: "On hold",
};

export type EoisLikeYours =
  | {
      kind: "ready";
      month: MonthKey;
      basis: "your-month" | "latest-complete";
      basisNote: string | null;
      sentence: string;
      numbers: {
        invited: string;
        lodged: string;
        waiting: string;
        closed: string;
        hold: string | null;
      };
      bar: Bar;
      /** Every outcome counted in the sentence's total, for the key. */
      outcomes: OutcomeRow[];
      statusNote: string;
      closedNote: string;
      nearby: CohortRow[];
    }
  | { kind: "too-old"; text: string }
  | { kind: "unavailable"; text: string }
  | { kind: "after-snapshot"; text: string }
  | { kind: "no-eois"; text: string }
  | { kind: "loading" };

const CLOSED_NOTE =
  "Closed means expired, withdrawn or finalised (finalised includes granted visas).";
const TOO_OLD = "Not available for EOIs this old.";
const UNAVAILABLE =
  "Published outcomes by submission month are not available for this occupation.";
const NEARBY_SPAN = 2;

function sum(intervals: Interval[]): Interval {
  return intervals.reduce(
    (a, b) => ({ min: a.min + b.min, max: a.max + b.max }),
    { min: 0, max: 0 },
  );
}

export function buildEoisLikeYours(input: {
  occupationName: string;
  core: OccupationCore;
  detail: OccupationDetail | null;
  submittedMonth: MonthKey | null;
  asOf: string;
}): EoisLikeYours {
  const { occupationName, core, detail, submittedMonth } = input;
  const basis = submittedMonth ? "your-month" : "latest-complete";
  const month = submittedMonth ?? calendarMonths(core.asAt, 2)[0];
  if (month > core.asAt) {
    return {
      kind: "after-snapshot",
      text: afterSnapshotText(month, core.asAt),
    };
  }
  if (month < cohortWindowStart(core.asAt)) {
    return { kind: "too-old", text: TOO_OLD };
  }
  if (!detail) return { kind: "loading" };
  if (!detail.cohorts["189"]) return { kind: "unavailable", text: UNAVAILABLE };
  const outcome = cohortOutcomes(detail, "189", month);
  // In a fetched cohort table, a month with no row has no EOIs (DATA.md).
  if (!outcome) {
    return {
      kind: "no-eois",
      text: `No ${occupationName} 189 EOIs from ${formatMonth(month)} appear in this snapshot.`,
    };
  }

  const { SUBMITTED, INVITED, LODGED, HOLD, CLOSED } = outcome.counts;
  const range = sum([SUBMITTED, INVITED, LODGED, HOLD, CLOSED]);
  const holdIsZero = HOLD.min === 0 && HOLD.max === 0;
  const bar: Bar = {
    invited: INVITED,
    lodged: LODGED,
    waiting: SUBMITTED,
    closed: CLOSED,
  };
  const counted = { ...bar, hold: HOLD };
  const keys: OutcomeRow["key"][] = ["invited", "lodged", "waiting", "closed"];
  if (!holdIsZero) keys.push("hold");
  const outcomes = keys.map((key): OutcomeRow => ({
    key,
    label: OUTCOME_LABELS[key],
    count: formatCount(counted[key]),
    interval: counted[key],
  }));
  const asAtLabel = formatMonth(core.asAt);

  const months = Object.keys(detail.cohorts["189"] ?? {})
    .filter((key) => key !== "older")
    .sort();
  const at = months.indexOf(month);
  const nearby = months
    .slice(Math.max(0, at - NEARBY_SPAN), at + NEARBY_SPAN + 1)
    .map((key): CohortRow => {
      const counts = cohortOutcomes(detail, "189", key)!.counts;
      return {
        month: key,
        label: formatMonth(key),
        invited: formatCount(counts.INVITED),
        lodged: formatCount(counts.LODGED),
        waiting: formatCount(counts.SUBMITTED),
        closed: formatCount(counts.CLOSED),
        isYours: key === month,
      };
    });

  return {
    kind: "ready",
    month,
    basis,
    basisNote: submittedMonth
      ? null
      : `You haven't added an EOI date, so this shows EOIs submitted in ${formatMonth(month)}.`,
    sentence: `Of the ${formatSummed(range)} ${occupationName} EOIs from ${formatMonth(month)}, as at ${asAtLabel}: ${countInSentence(INVITED)} are invited and ${countInSentence(LODGED)} have a visa application lodged.`,
    numbers: {
      invited: formatCount(INVITED),
      lodged: formatCount(LODGED),
      waiting: formatCount(SUBMITTED),
      closed: formatCount(CLOSED),
      hold: holdIsZero ? null : formatCount(HOLD),
    },
    bar,
    outcomes,
    statusNote: `Each EOI is counted once, in its status as at ${asAtLabel}; EOIs that lodged or closed may have been invited earlier.`,
    closedNote: CLOSED_NOTE,
    nearby,
  };
}
