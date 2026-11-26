import { calendarMonths } from "../data/months";
import { sumIntervals } from "../data/published-count";
import { stateInvitedCell } from "../data/state-totals";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  OccupationIndexEntry,
  StateCode,
  StateVisa,
} from "../data/types";

/**
 * A state's month-end INVITED stock: EOIs holding an unused invitation from
 * the state at the month's end. It is not the invitations issued that
 * month, so months overlap and are never added or differenced (docs/DATA.md).
 */
export type StateFigureCell = { total: Interval; maskedCells: number };

/** `figure` is null when no occupation had the month fetched: "not published", never zero. */
export type StateMonth = { month: MonthKey; figure: StateFigureCell | null };

export type StateSeries = {
  months: StateMonth[];
  /** The largest interval maximum of the window, the chart's scale (at least 1). */
  tallest: number;
  /** Index of the first July after the window's first month: a program year starts there. */
  programYearStart: number | null;
};

export const SERIES_MONTHS = 12;

/**
 * The cores the state pages read: every occupation still in the data whose
 * core is for the data month. hasData:false occupations count too, because
 * their "<20" cells must stay inside the interval (as the recap does).
 */
export function currentCores(
  index: readonly OccupationIndexEntry[],
  load: (code: string) => OccupationCore | null,
  asAt: MonthKey,
): OccupationCore[] {
  return index
    .filter((entry) => entry.lastAsAt === undefined)
    .flatMap((entry) => load(entry.code) ?? [])
    .filter((core) => core.asAt === asAt);
}

/** One state's INVITED figure in one visa and month, summed over occupations and scores. */
export function stateMonthFigure(
  cores: readonly OccupationCore[],
  visa: StateVisa,
  state: StateCode,
  month: MonthKey,
): StateFigureCell | null {
  const cells = cores.flatMap(
    (core) => stateInvitedCell(core, visa, state, month) ?? [],
  );
  if (cells.length === 0) return null;
  return {
    total: sumIntervals(cells.map((cell) => cell.total)),
    maskedCells: cells.reduce((n, cell) => n + cell.masked, 0),
  };
}

export function stateSeries(
  cores: readonly OccupationCore[],
  visa: StateVisa,
  state: StateCode,
  asAt: MonthKey,
  count = SERIES_MONTHS,
): StateSeries {
  const months = calendarMonths(asAt, count).map((month) => ({
    month,
    figure: stateMonthFigure(cores, visa, state, month),
  }));
  const july = months.findIndex((m, i) => i > 0 && m.month.endsWith("-07"));
  return {
    months,
    tallest: Math.max(1, ...months.map((m) => m.figure?.total.max ?? 0)),
    programYearStart: july === -1 ? null : july,
  };
}

/** The latest month's figure; null when it was not published. */
export function latestFigure(series: StateSeries): StateFigureCell | null {
  return series.months[series.months.length - 1]?.figure ?? null;
}
