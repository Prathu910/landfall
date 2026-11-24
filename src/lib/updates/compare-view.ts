import { shiftMonth } from "../data/months";
import type { Interval, MonthKey, Visa } from "../data/types";
import {
  dayText,
  formatLongMonth,
  intervalText,
  longDayText,
  minimumText,
  monthEnd,
} from "./format";
import type { DataSection } from "./types";

/** The month-on-month table: national figures per visa, never added across visas. */
export type CompareView = {
  heading: string;
  lead: string;
  columns: { label: string; previous: string; current: string };
  rows: { label: string; previous: string; current: string }[];
  cautions: { title: string; text: string }[];
};

const CAUTIONS: CompareView["cautions"] = [
  {
    title: "Invitations are a snapshot, not a monthly total.",
    text: "They count EOIs holding an invitation on the day; EOIs that already lodged drop out, so these are minimums. We never add months together.",
  },
  {
    title: "Visas are separate.",
    text: "One EOI can choose 189, 190 and 491, so the rows can't be added up.",
  },
  {
    title: "A pool change isn't new interest.",
    text: "EOIs arrive, are invited, close and expire; the data doesn't separate these.",
  },
  {
    title: "Ranges",
    text: "come from counts under 20 that the data hides for each occupation.",
  },
];

const ROWS: { label: string; visa: Visa; kind: "submitted" | "invited" }[] = [
  { label: "189 pool (EOIs)", visa: "189", kind: "submitted" },
  { label: "Holding a 189 invitation", visa: "189", kind: "invited" },
  { label: "190 pool (EOIs)", visa: "190", kind: "submitted" },
  { label: "Holding a 190 invitation", visa: "190", kind: "invited" },
  { label: "491 pool (EOIs)", visa: "491", kind: "submitted" },
  { label: "Holding a 491 invitation", visa: "491", kind: "invited" },
];

const figureText = (kind: "submitted" | "invited", i: Interval) =>
  kind === "submitted" ? intervalText(i) : minimumText(i);

export function buildCompareView(
  data: DataSection,
  month: MonthKey,
): CompareView {
  const previousMonth = shiftMonth(month, -1);
  const previousEnd = monthEnd(previousMonth);
  const end = monthEnd(month);
  const pool = data.national["189"].submitted;
  const invited = data.national["189"].invited;
  const lead =
    pool.previous && invited.previous
      ? `The 189 pool went from ${intervalText(pool.previous)} EOIs on ${longDayText(previousEnd)} to ${intervalText(pool.current)} on ${longDayText(end)}, while EOIs holding a 189 invitation went from ${minimumText(invited.previous)} to ${minimumText(invited.current)}.`
      : `${formatLongMonth(previousMonth)} figures aren't in our data, so this table shows ${formatLongMonth(month)} only.`;
  return {
    heading: `How ${formatLongMonth(month)} compares with ${formatLongMonth(previousMonth)}`,
    lead,
    columns: {
      label: "All occupations",
      previous: dayText(previousEnd),
      current: dayText(end),
    },
    rows: ROWS.map(({ label, visa, kind }) => {
      const pair = data.national[visa][kind];
      return {
        label,
        previous: pair.previous
          ? figureText(kind, pair.previous)
          : "Not available",
        current: figureText(kind, pair.current),
      };
    }),
    cautions: CAUTIONS,
  };
}
