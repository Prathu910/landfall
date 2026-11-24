import { existsSync, readdirSync } from "node:fs";
import { parseCountText } from "../../src/lib/data/published-count";
import type {
  Manifest,
  MonthKey,
  OccupationCore,
  OccupationDetail,
  OccupationIndexEntry,
  Visa,
} from "../../src/lib/data/types";
import {
  assembleOccupations,
  type CoverageByView,
  type RowsByView,
} from "./generate-assemble";
import { matchRounds, type RoundsFile } from "./generate-rounds";
import { parseViewCoverage, parseViewRows } from "./generate-rows";
import { DASHBOARD_PAGE_URL } from "./qlik-constants";
import { readRawView } from "./raw-store";
import {
  CURRENT_ROUNDS_URL,
  PREVIOUS_ROUNDS_URL,
  type RoundPages,
} from "./rounds";
import { VIEWS } from "./views";

export { writeGenerated, type WriteOptions } from "./generate-write";
export type { RoundsFile } from "./generate-rounds";

export type GeneratedData = {
  manifest: Manifest;
  index: OccupationIndexEntry[];
  cores: OccupationCore[];
  details: OccupationDetail[];
  rounds: RoundsFile; // written to src/data/rounds.json
  newestRawMonth: MonthKey | null; // newest data/raw folder, for continuity checks
};

export type GenerateInput = {
  rawRoot: string;
  asAt: MonthKey;
  checkedAt: string;
  rounds: RoundPages;
  importVersion: string;
  /** Ignore raw revisions fetched after this date (YYYY-MM-DD). */
  revisionsUpTo?: string;
  /**
   * The data now in src/data. An occupation in it but absent from the new
   * data is carried forward unchanged, marked with lastAsAt/lastCheckedAt.
   */
  previous?: PreviousData | null;
};

export type PreviousData = {
  manifest: Manifest;
  core(code: string): OccupationCore | null;
  detail(code: string): OccupationDetail | null;
};

const VISAS: Visa[] = ["189", "190", "491"];

function rawMonths(rawRoot: string): MonthKey[] {
  if (!existsSync(rawRoot)) return [];
  return readdirSync(rawRoot)
    .filter((name) => /^\d{4}-(0[1-9]|1[0-2])$/.test(name))
    .sort();
}

export function snapshotIdFor(asAt: MonthKey): string {
  const year = Number(asAt.slice(0, 4));
  const month = Number(asAt.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `skillselect-${asAt}-${lastDay}`;
}

/**
 * Latest-only views come from the asAt folder. Multi-month views come from
 * every stored folder up to asAt (newest revision each), which keeps history
 * older than the dashboard's own 24-month window. Coverage lists every
 * fetched part, so a month with no rows still counts as fetched (zero).
 */
function readRows(
  rawRoot: string,
  asAt: MonthKey,
  months: MonthKey[],
  revisionsUpTo?: string,
): { rows: RowsByView; coverage: CoverageByView } {
  const rows = {} as RowsByView;
  const coverage = {} as CoverageByView;
  for (const view of VIEWS) {
    const viewMonths = view.months === "latest" ? [asAt] : months;
    const files = viewMonths.flatMap((month) => {
      const file = readRawView(rawRoot, month, view.id, { revisionsUpTo });
      if (!file) {
        if (month === asAt) {
          throw new Error(`${view.id} ${asAt}: raw view is missing`);
        }
        return [];
      }
      if (file.viewId !== view.id || file.asAt !== month) {
        throw new Error(
          `${view.id} ${month}: raw file holds ${file.viewId} ${file.asAt}`,
        );
      }
      return [file];
    });
    rows[view.id] = files.flatMap((file) => parseViewRows(view, file));
    coverage[view.id] = files.flatMap((file) => parseViewCoverage(view, file));
  }
  return { rows, coverage };
}

function manifestEntry(core: OccupationCore): Manifest["occupations"][number] {
  const totals: Partial<Record<Visa, string>> = {};
  for (const visa of VISAS) {
    const total = core.pool[visa]?.total;
    if (total !== undefined) totals[visa] = total;
  }
  // A masked "<20" total may hold EOIs, so it counts as data.
  const hasData = Object.values(totals).some(
    (total) => parseCountText(total).max > 0,
  );
  return {
    code: core.code,
    name: core.name,
    group: core.group,
    hasData,
    totals,
  };
}

type ManifestEntry = Manifest["occupations"][number];

/** Carries every previous occupation missing from the new data, marked. */
function carriedForward(
  previous: PreviousData,
  currentCodes: Set<string>,
): { entry: ManifestEntry; core: OccupationCore; detail: OccupationDetail }[] {
  return previous.manifest.occupations
    .filter((old) => !currentCodes.has(old.code))
    .map((old) => {
      const core = previous.core(old.code);
      const detail = previous.detail(old.code);
      if (!core || !detail) {
        throw new Error(`${old.code}: previous data files are missing`);
      }
      return {
        entry: {
          ...old,
          lastAsAt: old.lastAsAt ?? previous.manifest.asAt,
          lastCheckedAt: old.lastCheckedAt ?? previous.manifest.checkedAt,
        },
        core,
        detail,
      };
    });
}

function indexEntry(entry: ManifestEntry): OccupationIndexEntry {
  const { code, name, hasData, lastAsAt, lastCheckedAt } = entry;
  return lastAsAt
    ? { code, name, hasData, lastAsAt, lastCheckedAt }
    : { code, name, hasData };
}

export function generate(input: GenerateInput): GeneratedData {
  const months = rawMonths(input.rawRoot);
  const snapshotId = snapshotIdFor(input.asAt);
  const { rows, coverage } = readRows(
    input.rawRoot,
    input.asAt,
    months.filter((month) => month <= input.asAt),
    input.revisionsUpTo,
  );
  const occupations = assembleOccupations(rows, coverage, {
    snapshotId,
    asAt: input.asAt,
  });
  const rounds = matchRounds(
    input.rounds.rounds,
    occupations.map(({ core }) => core),
  );
  const cores = occupations.map(({ core }) => ({
    ...core,
    rounds189: rounds.cutoffs(core.code),
  }));
  const currentEntries = cores.map(manifestEntry);
  const dropped = input.previous
    ? carriedForward(input.previous, new Set(cores.map((core) => core.code)))
    : [];
  const byCode = (a: { code: string }, b: { code: string }) =>
    a.code.localeCompare(b.code);
  const entries = [
    ...currentEntries,
    ...dropped.map(({ entry }) => entry),
  ].sort(byCode);
  return {
    manifest: {
      schemaVersion: 1,
      snapshotId,
      asAt: input.asAt,
      checkedAt: input.checkedAt,
      importVersion: input.importVersion,
      sources: {
        dashboard: DASHBOARD_PAGE_URL,
        currentRounds: CURRENT_ROUNDS_URL,
        previousRounds: PREVIOUS_ROUNDS_URL,
      },
      roundsUnmatched: rounds.unmatched,
      occupations: entries,
    },
    index: entries.map(indexEntry),
    cores: [...cores, ...dropped.map(({ core }) => core)].sort(byCode),
    details: [
      ...occupations.map(({ detail }) => detail),
      ...dropped.map(({ detail }) => detail),
    ].sort(byCode),
    rounds: {
      schemaVersion: 2,
      rounds: rounds.file,
      skipped: input.rounds.skipped,
    },
    newestRawMonth: months.at(-1) ?? null,
  };
}
