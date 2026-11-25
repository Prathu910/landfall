import { shiftMonth } from "../data/months";
import type { NominationsTable } from "../data/rounds-file";
import type { MonthKey, StateCode, StateKey, StateVisa } from "../data/types";
import { STATE_NAMES } from "../state-outlook/context";
import {
  dayText,
  formatLongMonth,
  formatNumber,
  hiddenCountsText,
  leastText,
  longDayText,
  monthEnd,
  stateFigureText,
} from "./format";
import type { LinkOccupation, OccLink } from "./round-view";
import type { DataSection, StateFigure } from "./types";

export type ShadeBand = 1 | 2 | 3 | 4;

/** The map's four shade bands by state floor: 700+, 200+, 20+, under 20 each. */
export function shadeBand(floor: number): ShadeBand {
  if (floor >= 700) return 4;
  if (floor >= 200) return 3;
  if (floor >= 20) return 2;
  return 1;
}

/** Largest programs first, as in the mockup. */
export const STATE_ORDER: readonly StateCode[] = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
];
const TABLE_ORDER: readonly StateCode[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];

export type StateTile = {
  state: StateCode;
  name: string;
  figure: string;
  shade: ShadeBand;
  hidden: string | null;
  /** Last month's floor; null when last month wasn't fetched. */
  previous: string | null;
  top: { label: string; occupation: OccLink; figure: string } | null;
};

export type StateSectionView = {
  visa: StateVisa;
  label: string;
  heading: string;
  lead: string;
  map: Record<StateCode, { big: string; small: string; shade: ShadeBand }>;
  legend: { shade: ShadeBand; label: string }[];
  tiles: StateTile[];
  notRecorded: {
    label: string;
    figure: string;
    hidden: string | null;
    note: string;
  };
  nominations: {
    heading: string;
    cells: { state: StateCode; value: string }[];
    caption: string;
  } | null;
};

const VISA_LABELS: Record<StateVisa, string> = {
  "190": "190 · Skilled Nominated",
  "491": "491 · Skilled Work Regional, state-nominated",
};

const LEGEND: StateSectionView["legend"] = [
  { shade: 4, label: "700+" },
  { shade: 3, label: "200+" },
  { shade: 2, label: "20+" },
  { shade: 1, label: "under 20 each" },
];

/**
 * The state with the highest floor. `strictlyMost` only when that floor is
 * above every other state's interval maximum (spec 6.4); otherwise copy says
 * "the highest published minimum". Null when no state has a floor.
 */
export function stateLeader(
  figures: Record<StateKey, StateFigure>,
): { state: StateCode; floor: number; strictlyMost: boolean } | null {
  const ranked = [...STATE_ORDER].sort(
    (a, b) => figures[b].floor - figures[a].floor || (a < b ? -1 : 1),
  );
  const [state, ...others] = ranked;
  const floor = figures[state].floor;
  if (floor === 0) return null;
  const strictlyMost = others.every((s) => floor > figures[s].total.max);
  return { state, floor, strictlyMost };
}

function mapLabel(figure: StateFigure): StateSectionView["map"][StateCode] {
  const shade = shadeBand(figure.floor);
  if (figure.floor > 0) {
    return { big: formatNumber(figure.floor), small: "at least", shade };
  }
  return figure.maskedCells > 0
    ? { big: "<20", small: "each occupation", shade }
    : { big: "none", small: "published", shade };
}

function previousText(figure: StateFigure, previousEnd: string): string | null {
  if (figure.previousFloor === null) return null;
  const value =
    figure.previousFloor === 0
      ? "under 20 for each occupation"
      : `at least ${formatNumber(figure.previousFloor)}`;
  return `${dayText(previousEnd)}: ${value}`;
}

function tile(
  state: StateCode,
  figure: StateFigure,
  previousEnd: string,
  link: LinkOccupation,
): StateTile {
  const [top] = figure.top;
  return {
    state,
    name: STATE_NAMES[state],
    figure: stateFigureText(figure),
    shade: shadeBand(figure.floor),
    hidden: hiddenCountsText(figure.maskedCells),
    previous: previousText(figure, previousEnd),
    top: top
      ? {
          label: "Highest published minimum",
          occupation: link(top),
          figure: leastText(top.total),
        }
      : null,
  };
}

function lead(
  visa: StateVisa,
  figures: Record<StateKey, StateFigure>,
  month: MonthKey,
): string {
  const previousEnd = monthEnd(shiftMonth(month, -1));
  const allUnder20 = STATE_ORDER.every((s) => figures[s].previousFloor === 0);
  return [
    `EOIs holding a ${visa} invitation on ${longDayText(monthEnd(month))}, by the state or territory that invited them.`,
    allUnder20
      ? `On ${longDayText(previousEnd)}, every state was under 20 for each occupation.`
      : null,
    "Each figure is a minimum: the data hides counts under 20 for each occupation, and those are left out.",
  ]
    .filter((s): s is string => s !== null)
    .join(" ");
}

function nominationsView(
  table: NominationsTable | null,
  visa: StateVisa,
): StateSectionView["nominations"] {
  if (!table) return null;
  const values = table.byVisa[visa];
  const hasUnder5 = TABLE_ORDER.some((s) => values[s] === "<5");
  const year = table.programYear.replace("-", "–");
  return {
    heading: `Home Affairs nominations, ${year} program year to ${dayText(table.to)}`,
    cells: TABLE_ORDER.map((state) => ({ state, value: values[state] })),
    caption: [
      `A different measure: nominations Home Affairs counted from ${dayText(table.from)} to ${dayText(table.to)}, as published on its invitation rounds page.`,
      hasUnder5 ? '"<5" is published that way.' : null,
    ]
      .filter((s): s is string => s !== null)
      .join(" "),
  };
}

/** The 190 or 491 by-state part of a recap, from the month's data section. */
export function buildStateSection(
  visa: StateVisa,
  data: DataSection,
  month: MonthKey,
  link: LinkOccupation,
): StateSectionView {
  const figures = data.states[visa];
  const previousEnd = monthEnd(shiftMonth(month, -1));
  const notRecorded = figures.ANY;
  return {
    visa,
    label: VISA_LABELS[visa],
    heading: `${visa} invitations by state, ${formatLongMonth(month)}`,
    lead: lead(visa, figures, month),
    map: Object.fromEntries(
      STATE_ORDER.map((state) => [state, mapLabel(figures[state])]),
    ) as StateSectionView["map"],
    legend: LEGEND,
    tiles: STATE_ORDER.map((state) =>
      tile(state, figures[state], previousEnd, link),
    ),
    notRecorded: {
      label: "State not recorded",
      figure: stateFigureText(notRecorded),
      hidden: hiddenCountsText(notRecorded.maskedCells),
      note: "Invited EOIs where the data doesn't name the state. Never added to a state.",
    },
    nominations: nominationsView(data.nominations, visa),
  };
}
