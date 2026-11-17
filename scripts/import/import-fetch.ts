import type { MonthKey } from "../../src/lib/data/types";
import { STATE_KEYS } from "./generate-rows";
import { poolScores, type FetchJob } from "./import-plan";
import type { QlikSession } from "./qlik-client";
import type { RawViewFile } from "./raw-store";
import { runView } from "./run-view";

/** Below this many rows, two partitions may legitimately match exactly. */
const IDENTICAL_TABLE_MIN_ROWS = 20;

type Table = Awaited<ReturnType<QlikSession["readTable"]>>;

function sameTable(a: Table, b: Table): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Every query differs in at least one selection from the one before it, so a
 * repeated sizeable table means a selection silently matched nothing. Stop
 * before spending more page reads on unfiltered data.
 */
function guarded(
  session: QlikSession,
  log: (line: string) => void,
  label: () => string,
): QlikSession {
  let previous: Table | undefined;
  return {
    ...session,
    async readTable(objectId) {
      const table = await session.readTable(objectId);
      log(
        `${label()}: ${table.rows.length} rows, ${session.pageReads()} page reads so far`,
      );
      if (
        previous &&
        table.rows.length >= IDENTICAL_TABLE_MIN_ROWS &&
        sameTable(previous, table)
      ) {
        throw new Error(
          `${label()}: identical to the previous query's table; a selection likely did not apply`,
        );
      }
      previous = table;
      return table;
    },
  };
}

export type FetchOptions = {
  log: (line: string) => void;
  /** Called as each view-month completes, so finished work survives a later failure. */
  onFile?: (file: RawViewFile) => void;
  /** The stored pool-by-score file, used when this run does not fetch it. */
  readStoredPool?: (month: MonthKey) => RawViewFile | undefined;
};

function scoresFor(
  job: FetchJob,
  fetched: RawViewFile[],
  options: FetchOptions,
): string[] {
  if (!job.view.partitionBy.includes("score")) return [];
  const pool =
    fetched.find(
      (file) => file.viewId === "pool-by-score" && file.asAt === job.month,
    ) ?? options.readStoredPool?.(job.month);
  if (!pool) {
    throw new Error(
      `${job.view.id} ${job.month}: pool-by-score must be fetched or stored first for its scores`,
    );
  }
  return poolScores(pool);
}

/** Runs each job in order and returns the raw files. */
export async function fetchViews(
  session: QlikSession,
  jobs: FetchJob[],
  options: FetchOptions,
): Promise<RawViewFile[]> {
  const fetched: RawViewFile[] = [];
  let current = "";
  const reader = guarded(session, options.log, () => current);
  for (const [index, job] of jobs.entries()) {
    current = `[${index + 1}/${jobs.length}] ${job.view.id} ${job.month}`;
    const file = await runView(reader, job.view, job.month, {
      state: STATE_KEYS,
      score: scoresFor(job, fetched, options),
    });
    fetched.push(file);
    options.onFile?.(file);
  }
  return fetched;
}
