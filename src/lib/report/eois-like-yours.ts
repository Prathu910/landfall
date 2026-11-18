import { cohortOutcomes } from "../data/cohorts";
import { calendarMonths, cohortWindowStart } from "../data/months";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  OccupationDetail,
} from "../data/types";
import { formatInterval } from "../pool";
import {
  afterSnapshotText,
  countInSentence,
  formatCount,
  formatMonth,
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
    sentence: `Of the ${formatInterval(range)} ${occupationName} EOIs from ${formatMonth(month)}, as at ${asAtLabel}: ${countInSentence(INVITED)} are invited and ${countInSentence(LODGED)} have a visa application lodged.`,
    numbers: {
      invited: formatCount(INVITED),
      lodged: formatCount(LODGED),
      waiting: formatCount(SUBMITTED),
      closed: formatCount(CLOSED),
      hold: HOLD.min === 0 && HOLD.max === 0 ? null : formatCount(HOLD),
    },
    bar: {
      invited: INVITED,
      lodged: LODGED,
      waiting: SUBMITTED,
      closed: CLOSED,
    },
    closedNote: CLOSED_NOTE,
    nearby,
  };
}
