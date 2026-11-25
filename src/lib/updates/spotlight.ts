import { calendarMonths } from "../data/months";
import { parseCountText, sumIntervals } from "../data/published-count";
import type { RoundsFile, StoredRound } from "../data/rounds-file";
import type {
  CountText,
  EoiStatus,
  Interval,
  MonthKey,
  OccupationCore,
  StateCode,
  Visa,
} from "../data/types";
import type { FederalList } from "../state-outlook/rules-types";
import { monthOfDate } from "./dates";
import type { Spotlight, SpotlightSeries } from "./types";

const POPULAR_COUNT = 20;
const ROUND_COUNT = 6;
const TOP_STATES = 4;
const VISAS: Visa[] = ["189", "190", "491"];
const STATES: StateCode[] = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
];
const SERIES: { series: SpotlightSeries; status: EoiStatus; visa: Visa }[] = [
  ...VISAS.map((visa) => ({
    series: `SUBMITTED-${visa}` as const,
    status: "SUBMITTED" as const,
    visa,
  })),
  ...VISAS.map((visa) => ({
    series: `INVITED-${visa}` as const,
    status: "INVITED" as const,
    visa,
  })),
];

/**
 * The part of a month-on-month change that holds whatever the masked counts
 * hide: 0 when the interval `[cur.min - prev.max, cur.max - prev.min]` contains
 * 0, otherwise its smaller absolute end.
 */
export function guaranteedChange(
  current: Interval,
  previous: Interval,
): number {
  const low = current.min - previous.max;
  const high = current.max - previous.min;
  if (low <= 0 && high >= 0) return 0;
  return Math.min(Math.abs(low), Math.abs(high));
}

type Change = {
  series: SpotlightSeries;
  change: Interval;
  guaranteed: number;
  relative: number;
};

/** The count text for a status in a month, undefined when the month was not fetched. */
function statusText(
  core: OccupationCore,
  visa: Visa,
  month: MonthKey,
  status: EoiStatus,
): CountText | undefined {
  const cell = core.statusHistory[visa]?.[month];
  if (cell === undefined) return undefined;
  return cell[status] ?? "0";
}

/** The occupation's largest guaranteed change over the six series, or null. */
function bestChange(
  core: OccupationCore,
  month: MonthKey,
  previousMonth: MonthKey,
): Change | null {
  let best: Change | null = null;
  for (const { series, status, visa } of SERIES) {
    const now = statusText(core, visa, month, status);
    const before = statusText(core, visa, previousMonth, status);
    if (now === undefined || before === undefined) continue;
    const current = parseCountText(now);
    const previous = parseCountText(before);
    const guaranteed = guaranteedChange(current, previous);
    const relative = guaranteed / Math.max(previous.max, 1);
    if (
      best === null ||
      guaranteed > best.guaranteed ||
      (guaranteed === best.guaranteed && relative > best.relative)
    ) {
      best = {
        series,
        change: {
          min: current.min - previous.max,
          max: current.max - previous.min,
        },
        guaranteed,
        relative,
      };
    }
  }
  return best;
}

/** Ranking key only, never shown: one EOI can sit under several visas. */
function popularity(core: OccupationCore): number {
  return VISAS.reduce(
    (sum, visa) => sum + parseCountText(core.pool[visa]?.total ?? "0").min,
    0,
  );
}

/** States by the floor of their 190 INVITED total in the month. */
function top190(
  core: OccupationCore,
  month: MonthKey,
): Spotlight["card"]["top190"] {
  return STATES.map((state) => ({
    state,
    floor: sumIntervals(
      Object.values(core.stateInvited["190"]?.[state]?.[month] ?? {}).map(
        parseCountText,
      ),
    ).min,
  }))
    .filter((entry) => entry.floor > 0)
    .sort((a, b) => b.floor - a.floor || (a.state < b.state ? -1 : 1))
    .slice(0, TOP_STATES);
}

/** The occupation's lowest cut-off row in a round, or null when not listed. */
export function listedRow(round: StoredRound, code: string) {
  return round.rows
    .filter((row) => row.code === code)
    .reduce<StoredRound["rows"][number] | null>(
      (low, row) => (low === null || row.cutoff < low.cutoff ? row : low),
      null,
    );
}

function buildCard(
  core: OccupationCore,
  month: MonthKey,
  previousMonth: MonthKey,
  rounds: StoredRound[],
  federal: FederalList,
): Spotlight["card"] {
  const [latest] = rounds;
  const latestRow = listedRow(latest, core.code);
  const latest189: Spotlight["card"]["latest189"] = latestRow
    ? { kind: "listed", date: latest.date, cutoff: latestRow.cutoff }
    : federal.entries[core.code]?.["189"]
      ? { kind: "not-listed", date: latest.date }
      : { kind: "not-on-list" };
  return {
    latest189,
    rounds: rounds.slice(0, ROUND_COUNT).map((round) => ({
      date: round.date,
      cutoff: listedRow(round, core.code)?.cutoff ?? null,
    })),
    tieBreak: latestRow?.tieBreak ?? null,
    invited189: {
      current: statusText(core, "189", month, "INVITED") ?? null,
      previous: statusText(core, "189", previousMonth, "INVITED") ?? null,
    },
    pool189: {
      current: statusText(core, "189", month, "SUBMITTED") ?? null,
      previous: statusText(core, "189", previousMonth, "SUBMITTED") ?? null,
    },
    top190: top190(core, month),
  };
}

/**
 * The 20 most popular occupations with data for the month, most popular
 * first (spec 6.8): the spotlight is chosen among them.
 */
export function popularOccupations(
  cores: OccupationCore[],
  month: MonthKey,
): OccupationCore[] {
  return cores
    .filter((core) => core.asAt === month)
    .map((core) => ({ core, floor: popularity(core) }))
    .sort((a, b) => b.floor - a.floor || (a.core.code < b.core.code ? -1 : 1))
    .slice(0, POPULAR_COUNT)
    .map((entry) => entry.core);
}

/**
 * The month's spotlight: the biggest guaranteed month-on-month change among
 * the 20 most popular occupations. `rounds` is cut at the month's end (R5) and
 * cores that dropped out of the data (older `asAt`) are ignored (R6).
 */
export function pickSpotlight(input: {
  cores: OccupationCore[];
  month: MonthKey;
  previousCode: string | null;
  override: string | null;
  rounds: RoundsFile;
  federal: FederalList;
}): Spotlight {
  const { month, previousCode, override, federal } = input;
  const previousMonth = calendarMonths(month, 2)[0];
  const current = input.cores.filter((core) => core.asAt === month);
  const rounds = input.rounds.rounds
    .filter((round) => monthOfDate(round.date) <= month)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (rounds.length === 0) throw new Error(`No rounds up to ${month}`);

  const popular = popularOccupations(input.cores, month);
  const eligible = popular.filter((core) => core.code !== previousCode);

  const scored = eligible
    .map((core) => ({ core, best: bestChange(core, month, previousMonth) }))
    .filter(
      (entry): entry is { core: OccupationCore; best: Change } =>
        entry.best !== null && entry.best.guaranteed > 0,
    )
    .sort(
      (a, b) =>
        b.best.guaranteed - a.best.guaranteed ||
        b.best.relative - a.best.relative ||
        (a.core.code < b.core.code ? -1 : 1),
    );

  let core: OccupationCore;
  let qualifiedBy: Spotlight["qualifiedBy"] = null;
  let pickedBy: Spotlight["pickedBy"] = "auto";
  if (override !== null) {
    const chosen = current.find((c) => c.code === override);
    if (!chosen) throw new Error(`Spotlight ${override} is not in ${month}`);
    core = chosen;
    pickedBy = "founder";
    const best = bestChange(core, month, previousMonth);
    if (best && best.guaranteed > 0) {
      qualifiedBy = {
        series: best.series,
        change: best.change,
        guaranteed: best.guaranteed,
      };
    }
  } else if (scored.length > 0) {
    core = scored[0].core;
    const { series, change, guaranteed } = scored[0].best;
    qualifiedBy = { series, change, guaranteed };
  } else {
    const fallback = eligible[0] ?? popular[0];
    if (!fallback) throw new Error(`No occupations in ${month}`);
    core = fallback;
  }
  return {
    code: core.code,
    name: core.name,
    pickedBy,
    qualifiedBy,
    card: buildCard(core, month, previousMonth, rounds, federal),
  };
}
