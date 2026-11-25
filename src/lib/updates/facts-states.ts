import { shiftMonth } from "../data/months";
import { parseCountText, sumIntervals } from "../data/published-count";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  StateKey,
  StateVisa,
} from "../data/types";
import { coresAsAt, previousMonthCores } from "./facts-national";
import type { StateFigure } from "./types";

const TOP_OCCUPATIONS = 3;
const STATE_VISAS: readonly StateVisa[] = ["190", "491"];
/** `ANY` is "State not recorded": its own key, never added to a state. */
const STATE_KEYS: readonly StateKey[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
  "ANY",
];

type Cell = { total: Interval; masked: number };

/** One occupation's INVITED cells for a state in a month; undefined when not fetched. */
function occupationCell(
  core: OccupationCore,
  visa: StateVisa,
  state: StateKey,
  month: MonthKey,
): Cell | undefined {
  const counts = core.stateInvited[visa]?.[state]?.[month];
  if (counts === undefined) return undefined;
  const texts = Object.values(counts);
  return {
    total: sumIntervals(texts.map(parseCountText)),
    masked: texts.filter((text) => text === "<20").length,
  };
}

function stateFigure(
  cores: readonly OccupationCore[],
  previousCores: readonly OccupationCore[],
  visa: StateVisa,
  state: StateKey,
  month: MonthKey,
): StateFigure {
  const rows = cores.flatMap((core) => {
    const cell = occupationCell(core, visa, state, month);
    return cell ? [{ core, cell }] : [];
  });
  if (rows.length === 0) {
    throw new Error(`No occupation has ${visa} ${state} figures for ${month}`);
  }
  const total = sumIntervals(rows.map((row) => row.cell.total));
  const previous = previousCores
    .map((core) => occupationCell(core, visa, state, shiftMonth(month, -1)))
    .filter((cell): cell is Cell => cell !== undefined);
  const top = rows
    .filter((row) => row.cell.total.min > 0)
    .sort(
      (a, b) =>
        b.cell.total.min - a.cell.total.min ||
        (a.core.code < b.core.code ? -1 : 1),
    )
    .slice(0, TOP_OCCUPATIONS)
    .map(({ core, cell }) => ({
      code: core.code,
      name: core.name,
      total: cell.total,
    }));
  return {
    total,
    floor: total.min,
    maskedCells: rows.reduce((n, row) => n + row.cell.masked, 0),
    previousFloor:
      previous.length === 0
        ? null
        : sumIntervals(previous.map((cell) => cell.total)).min,
    top,
  };
}

/**
 * 190 and 491 invitations per state in the month: the sum of each state's
 * occupation-by-score cells within one visa, with its floor, its hidden
 * ("<20") cells, last month's floor and the occupations with the highest
 * floors. States are never added to each other or to `ANY`. `dropped` holds
 * the cores of occupations that dropped out this month; they count towards
 * last month's floor only.
 */
export function stateFigures(
  cores: readonly OccupationCore[],
  month: MonthKey,
  dropped: readonly OccupationCore[] = [],
): Record<StateVisa, Record<StateKey, StateFigure>> {
  const current = coresAsAt(cores, month);
  const previous = previousMonthCores(current, dropped, month);
  const forVisa = (visa: StateVisa) =>
    Object.fromEntries(
      STATE_KEYS.map((state) => [
        state,
        stateFigure(current, previous, visa, state, month),
      ]),
    ) as Record<StateKey, StateFigure>;
  return Object.fromEntries(
    STATE_VISAS.map((visa) => [visa, forVisa(visa)]),
  ) as Record<StateVisa, Record<StateKey, StateFigure>>;
}
