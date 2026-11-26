import type { MonthKey, StateVisa } from "../data/types";
import { formatMonth } from "../report/copy";
import { dayText, formatNumber, monthEnd } from "../updates/format";
import { figureText } from "./copy";
import type { StateVisaFacts } from "./facts";
import type { StateMonth } from "./series";

export type MonthKind = "floor" | "hidden" | "none" | "not-published";

export type MonthColumnView = {
  month: MonthKey;
  /** "Nov"; the year sits under the first column and every January. */
  label: string;
  year: string | null;
  kind: MonthKind;
  /** The short visible label: "790+", "<20 each", "none", "n/p". */
  value: string;
  /** The same figure in words, for screen readers and the table. */
  held: string;
  full: string;
  maskedCells: number;
  minShare: number;
  maxShare: number;
  latest: boolean;
  /** "2026–27" on the column that starts a program year. */
  programYear: string | null;
};

export type MonthsCardView = {
  visa: StateVisa;
  heading: string;
  columns: MonthColumnView[];
  table: {
    summary: string;
    caption: string;
    rows: { month: string; held: string; hidden: string }[];
  };
  key: { published: string; hidden: string };
  note: string | null;
};

function kindOf(entry: StateMonth): MonthKind {
  if (entry.figure === null) return "not-published";
  if (entry.figure.total.min > 0) return "floor";
  return entry.figure.maskedCells > 0 ? "hidden" : "none";
}

const SHORT: Record<Exclude<MonthKind, "floor">, string> = {
  hidden: "<20 each",
  none: "none",
  "not-published": "n/p",
};

function programYearOf(month: MonthKey): string {
  const year = Number(month.slice(0, 4));
  return `${year}–${String(year + 1).slice(2)}`;
}

function column(
  entry: StateMonth,
  index: number,
  facts: StateVisaFacts,
): MonthColumnView {
  const kind = kindOf(entry);
  const { tallest, months, programYearStart } = facts.series;
  const total = entry.figure?.total ?? { min: 0, max: 0 };
  const [year, month] = formatMonth(entry.month).split(" ").reverse();
  return {
    month: entry.month,
    label: month,
    year: index === 0 || entry.month.endsWith("-01") ? year : null,
    kind,
    value: kind === "floor" ? `${formatNumber(total.min)}+` : SHORT[kind],
    held: figureText(entry.figure),
    full: `${dayText(monthEnd(entry.month))}: ${figureText(entry.figure)}`,
    maskedCells: entry.figure?.maskedCells ?? 0,
    minShare: total.min / tallest,
    maxShare: total.max / tallest,
    latest: index === months.length - 1,
    programYear: index === programYearStart ? programYearOf(entry.month) : null,
  };
}

/** One visa's 12 month ends: the chart's columns and the same figures as a table. */
export function monthsCardView(
  facts: StateVisaFacts,
  searchName: string,
): MonthsCardView {
  const columns = facts.series.months.map((entry, i) =>
    column(entry, i, facts),
  );
  const anyFloor = columns.some((c) => c.kind === "floor");
  return {
    visa: facts.visa,
    heading: `${searchName} ${facts.visa}: EOIs holding an invitation at each month end`,
    columns,
    table: {
      summary: "Month by month",
      caption: `EOIs holding ${searchName} ${facts.visa} invitations at each month end`,
      rows: columns.map((c) => ({
        month: dayText(monthEnd(c.month)),
        held: c.held,
        hidden: c.kind === "not-published" ? "—" : formatNumber(c.maskedCells),
      })),
    },
    key: {
      published: "published (20 or more per occupation and score)",
      hidden: "hidden counts under 20, may be zero",
    },
    note: anyFloor
      ? null
      : `Every ${searchName} ${facts.visa} count in these 12 months was under 20 for each occupation and score, so each bar is only the hidden range.`,
  };
}
