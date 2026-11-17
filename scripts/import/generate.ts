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
): { rows: RowsByView; coverage: CoverageByView } {
  const rows = {} as RowsByView;
  const coverage = {} as CoverageByView;
  for (const view of VIEWS) {
    const viewMonths = view.months === "latest" ? [asAt] : months;
    const files = viewMonths.flatMap((month) => {
      const file = readRawView(rawRoot, month, view.id);
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

export function generate(input: GenerateInput): GeneratedData {
  const months = rawMonths(input.rawRoot);
  const snapshotId = snapshotIdFor(input.asAt);
  const { rows, coverage } = readRows(
    input.rawRoot,
    input.asAt,
    months.filter((month) => month <= input.asAt),
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
  const entries = cores.map(manifestEntry);
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
    index: entries.map(({ code, name, hasData }) => ({ code, name, hasData })),
    cores,
    details: occupations.map(({ detail }) => detail),
    rounds: { rounds: rounds.file, skipped: input.rounds.skipped },
    newestRawMonth: months.at(-1) ?? null,
  };
}
