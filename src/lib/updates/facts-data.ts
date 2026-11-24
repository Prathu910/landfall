import { shiftMonth } from "../data/months";
import type { RoundsFile, StoredRound } from "../data/rounds-file";
import type { Manifest, MonthKey, OccupationCore } from "../data/types";
import type { FederalList } from "../state-outlook/rules-types";
import { monthOfDate } from "./dates";
import {
  coresAsAt,
  nationalFigures,
  scoreTotals,
  VISAS,
} from "./facts-national";
import { stateFigures } from "./facts-states";
import { exactPool189, poolMovers } from "./movers";
import { listedRow, pickSpotlight } from "./spotlight";
import type {
  DataSection,
  NotableRow,
  NotListedRow,
  OccRef,
  RecapFacts,
} from "./types";

/** Parsed rounds dated in or before `month`, newest first (R5). */
function roundsUpTo(file: RoundsFile, month: MonthKey): StoredRound[] {
  return file.rounds
    .filter((round) => monthOfDate(round.date) <= month)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

const byPool = <T extends { code: string; pool: number }>(a: T, b: T) =>
  b.pool - a.pool || (a.code < b.code ? -1 : 1);

/**
 * The occupations listed in the newest round up to the month with the
 * largest exact 189 pools, with their cut-off, the previous round's cut-off,
 * tie-break date and holding a 189 invitation. Null with no round.
 */
export function notable189(
  cores: readonly OccupationCore[],
  rounds: RoundsFile,
  month: MonthKey,
  limit = 10,
): DataSection["notable189"] {
  const [round, previous] = roundsUpTo(rounds, month);
  if (!round) return null;
  const rows = coresAsAt(cores, month).flatMap((core) => {
    const row = listedRow(round, core.code);
    const pool = exactPool189(core, month);
    if (row === null || pool === null) return [];
    const cell = core.statusHistory["189"]?.[month];
    const entry: Omit<NotableRow, "pool"> & { pool: number } = {
      code: core.code,
      name: core.name,
      cutoff: row.cutoff,
      previousCutoff: previous
        ? (listedRow(previous, core.code)?.cutoff ?? null)
        : null,
      tieBreak: row.tieBreak,
      pool,
      invited: cell ? (cell.INVITED ?? "0") : null,
    };
    return [entry];
  });
  return {
    round: round.date,
    rows: rows
      .sort(byPool)
      .slice(0, limit)
      .map((row) => ({ ...row, pool: String(row.pool) })),
  };
}

/**
 * Occupations on the Home Affairs 189 list with the largest exact 189 pools
 * that the newest round up to the month did not list, with how many recent
 * rounds in a row left them out and the last round that listed them.
 */
export function largePoolsNotListed(
  cores: readonly OccupationCore[],
  rounds: RoundsFile,
  federal: FederalList,
  month: MonthKey,
  limit = 6,
): NotListedRow[] {
  const parsed = roundsUpTo(rounds, month);
  if (parsed.length === 0) return [];
  const rows = coresAsAt(cores, month).flatMap((core) => {
    const pool = exactPool189(core, month);
    if (!federal.entries[core.code]?.["189"] || !pool) return [];
    const listedAt = parsed.findIndex((r) => listedRow(r, core.code) !== null);
    if (listedAt === 0) return [];
    const last = listedAt === -1 ? null : parsed[listedAt];
    return [
      {
        code: core.code,
        name: core.name,
        pool,
        roundsNotListed: listedAt === -1 ? parsed.length : listedAt,
        lastListed: last
          ? { date: last.date, cutoff: listedRow(last, core.code)!.cutoff }
          : null,
      },
    ];
  });
  return rows.sort(byPool).slice(0, limit);
}

/** Codes still in the data: entries marked `lastAsAt` dropped out (R6). */
function currentEntries(manifest: Manifest): Map<string, string> {
  return new Map(
    manifest.occupations
      .filter((entry) => entry.lastAsAt === undefined)
      .map((entry) => [entry.code, entry.name]),
  );
}

function difference(a: Map<string, string>, b: Map<string, string>): OccRef[] {
  return [...a]
    .filter(([code]) => !b.has(code))
    .map(([code, name]) => ({ code, name }))
    .sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
}

function previousSource(
  previousMonth: MonthKey,
  previousManifest: Manifest | null,
  previousFacts: RecapFacts | null,
): DataSection["sources"]["previous"] {
  if (previousManifest?.asAt === previousMonth) {
    const { snapshotId, checkedAt } = previousManifest;
    return { month: previousMonth, snapshotId, checkedAt };
  }
  const data = previousFacts?.data;
  if (!data) return null;
  const { snapshotId, checkedAt } = data.sources;
  return { month: previousMonth, snapshotId, checkedAt };
}

/**
 * The month's data section, from its dashboard snapshot and the stored
 * rounds. Occupations marked `lastAsAt` in the manifest are left out of every
 * sum, ranking and pick (R6); rounds after the month are ignored (R5), except
 * that the nominations table is the newest one stored.
 */
export function buildDataSection(input: {
  month: MonthKey;
  cores: readonly OccupationCore[];
  manifest: Manifest;
  previousManifest: Manifest | null;
  previousFacts: RecapFacts | null;
  rounds: RoundsFile;
  federal: FederalList;
  today: string;
  /** A founder's spotlight pick; must be a current code. */
  spotlight?: string | null;
}): DataSection {
  const { month, manifest, previousManifest, previousFacts } = input;
  const { rounds, federal } = input;
  if (manifest.asAt !== month) {
    throw new Error(
      `Data section for ${month} needs the ${manifest.asAt} data`,
    );
  }
  const previousMonth = shiftMonth(month, -1);
  if (previousFacts && previousFacts.month !== previousMonth) {
    throw new Error(
      `Previous facts are for ${previousFacts.month}, not ${previousMonth}`,
    );
  }
  const entries = currentEntries(manifest);
  const cores = coresAsAt(input.cores, month).filter((core) =>
    entries.has(core.code),
  );
  const byVisa = <T>(f: (visa: (typeof VISAS)[number]) => T) =>
    Object.fromEntries(VISAS.map((visa) => [visa, f(visa)])) as Record<
      (typeof VISAS)[number],
      T
    >;
  const nominations =
    [...rounds.rounds]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .find((round) => round.nominations !== null)?.nominations ?? null;
  const previousEntries = previousManifest
    ? currentEntries(previousManifest)
    : null;

  return {
    generatedAt: input.today,
    sources: {
      snapshotId: manifest.snapshotId,
      checkedAt: manifest.checkedAt,
      previous: previousSource(previousMonth, previousManifest, previousFacts),
      federalListCheckedAt: federal.checkedAt,
    },
    national: nationalFigures(cores, month),
    pool189ByScore: scoreTotals(cores, month, "189", "pool"),
    invitedByScore: byVisa((visa) =>
      scoreTotals(cores, month, visa, "invited"),
    ),
    states: stateFigures(cores, month),
    nominations,
    movers: poolMovers(cores, month),
    notable189: notable189(cores, rounds, month),
    largePoolsNotListed: largePoolsNotListed(cores, rounds, federal, month),
    spotlight: pickSpotlight({
      cores,
      month,
      previousCode: previousFacts?.data?.spotlight.code ?? null,
      override: input.spotlight ?? null,
      rounds,
      federal,
    }),
    occupationsAdded: previousEntries
      ? difference(entries, previousEntries)
      : null,
    occupationsRemoved: previousEntries
      ? difference(previousEntries, entries)
      : null,
  };
}
