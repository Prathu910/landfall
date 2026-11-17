import type {
  CountText,
  MonthKey,
  OccupationCore,
  OccupationDetail,
  ScoreCounts,
  StateVisa,
  Visa,
} from "../../src/lib/data/types";
import type { ParsedRow } from "./generate-rows";
import { VIEWS, type ViewId } from "./views";

export type RowsByView = Record<ViewId, ParsedRow[]>;
export type AssembledOccupation = {
  core: OccupationCore;
  detail: OccupationDetail;
};

type Builder = AssembledOccupation & {
  poolByScore: Partial<Record<Visa, ScoreCounts>>;
};

const VISAS: Visa[] = ["189", "190", "491"];

/** Cohorts cover the last 36 submitted months (pre-approved reduction 1). */
const COHORT_MONTHS = 36;

/** Nested map level, created empty on first use. Every level is a plain object map. */
function child<T extends object>(
  map: { [key: string]: T | undefined },
  key: string,
): T {
  const existing = map[key];
  if (existing) return existing;
  const created = {} as T;
  map[key] = created;
  return created;
}

function put(
  map: { [key: string]: CountText | undefined },
  key: string,
  row: ParsedRow,
  view: ViewId,
): void {
  if (map[key] !== undefined) {
    throw new Error(
      `${view} ${row.asAt}: duplicate row for ${row.code} visa ${row.visa} (${key})`,
    );
  }
  map[key] = row.count;
}

function need<K extends keyof ParsedRow>(
  row: ParsedRow,
  key: K,
  view: ViewId,
): NonNullable<ParsedRow[K]> {
  const value = row[key];
  if (value === undefined || value === null) {
    throw new Error(`${view} ${row.asAt}: row for ${row.code} has no ${key}`);
  }
  return value;
}

function stateVisa(row: ParsedRow, view: ViewId): StateVisa {
  if (row.visa === "189") {
    throw new Error(`${view} ${row.asAt}: 189 row in a state view`);
  }
  return row.visa;
}

function monthIndex(month: MonthKey): number {
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
}

export function cohortWindowStart(asAt: MonthKey): MonthKey {
  const index = monthIndex(asAt) - (COHORT_MONTHS - 1);
  const month = String((index % 12) + 1).padStart(2, "0");
  return `${Math.floor(index / 12)}-${month}`;
}

type Handler = (o: Builder, row: ParsedRow, view: ViewId) => void;

function cohortHandlers(windowStart: MonthKey): {
  cohorts: Handler;
  cohortsByScore: Handler;
} {
  // Older submitted months are dropped, not summed into an "older" bucket:
  // a sum of masked cells is an interval that CountText cannot express, and
  // those cohorts show only LODGED/CLOSED anyway.
  const inWindow = (row: ParsedRow, view: ViewId) =>
    need(row, "submittedMonth", view) >= windowStart;
  return {
    cohorts: (o, row, view) => {
      if (!inWindow(row, view)) return;
      const visa = child(o.detail.cohorts, row.visa);
      put(
        child(visa, need(row, "submittedMonth", view)),
        row.status,
        row,
        view,
      );
    },
    cohortsByScore: (o, row, view) => {
      if (!inWindow(row, view)) return;
      const visa = child(o.detail.cohortsByScore, row.visa);
      const score = child(visa, need(row, "score", view));
      put(score, need(row, "submittedMonth", view), row, view);
    },
  };
}

function handlers(asAt: MonthKey): Record<ViewId, Handler> {
  const cohorts = cohortHandlers(cohortWindowStart(asAt));
  return {
    "pool-by-score": (o, row, view) =>
      put(child(o.poolByScore, row.visa), need(row, "score", view), row, view),
    "status-history": (o, row, view) =>
      put(
        child(child(o.core.statusHistory, row.visa), row.asAt),
        row.status,
        row,
        view,
      ),
    "invited-by-score": (o, row, view) =>
      put(
        child(child(o.core.invitedByScore, row.visa), row.asAt),
        need(row, "score", view),
        row,
        view,
      ),
    cohorts: cohorts.cohorts,
    "cohorts-by-score": cohorts.cohortsByScore,
    "state-pool": (o, row, view) => {
      const visa = child(o.core.statePool, stateVisa(row, view));
      const state = child(visa, need(row, "state", view));
      put(state, need(row, "score", view), row, view);
    },
    "state-invited": (o, row, view) => {
      const visa = child(o.core.stateInvited, stateVisa(row, view));
      const state = child(visa, need(row, "state", view));
      put(child(state, row.asAt), need(row, "score", view), row, view);
    },
    "invited-profile": (o, row, view) => {
      const visa = child(o.detail.invitedProfile, row.visa);
      const attribute = child(visa, need(row, "attribute", view));
      const value = child(attribute, need(row, "attributeValue", view));
      put(value, row.asAt, row, view);
    },
    "invited-profile-state": (o, row, view) => {
      const visa = child(o.detail.invitedProfileState, stateVisa(row, view));
      const state = child(visa, need(row, "state", view));
      const attribute = child(state, need(row, "attribute", view));
      put(attribute, need(row, "attributeValue", view), row, view);
    },
  };
}

function newBuilder(
  row: ParsedRow,
  identity: { snapshotId: string; asAt: MonthKey },
): Builder {
  const base = { schemaVersion: 1 as const, ...identity, code: row.code };
  return {
    core: {
      ...base,
      name: row.name,
      group: null, // no view imports Occupation Group
      pool: {},
      statusHistory: {},
      invitedByScore: {},
      statePool: {},
      stateInvited: {},
      rounds189: [],
    },
    detail: {
      ...base,
      cohorts: {},
      cohortsByScore: {},
      invitedProfile: {},
      invitedProfileState: {},
    },
    poolByScore: {},
  };
}

/**
 * pool.total is the SUBMITTED total read with points hidden (status-history).
 * That table is fully paged, so a missing SUBMITTED row is a published zero.
 * A visa with neither a total nor score rows gets no pool: unavailable.
 */
function finishPool(o: Builder, asAt: MonthKey): void {
  for (const visa of VISAS) {
    const total = o.core.statusHistory[visa]?.[asAt]?.SUBMITTED;
    const byScore = o.poolByScore[visa];
    if (total === undefined && byScore === undefined) continue;
    o.core.pool[visa] = { total: total ?? "0", byScore: byScore ?? {} };
  }
}

/**
 * Codes present at asAt: any row of a latest-only view, or an asAt row of
 * status-history (R9). History-only codes stay in data/raw but are not
 * surfaced, so a broken latest import shows up as a drop in the count.
 */
function presentCodes(rowsByView: RowsByView, asAt: MonthKey): Set<string> {
  const codes = new Set<string>();
  for (const view of VIEWS) {
    if (view.months !== "latest" && view.id !== "status-history") continue;
    for (const row of rowsByView[view.id]) {
      if (row.asAt === asAt) codes.add(row.code);
    }
  }
  return codes;
}

/**
 * Builds one core and detail per code present at asAt, sorted by code. Rows
 * are applied oldest as-at first, so the newest displayed name wins.
 */
export function assembleOccupations(
  rowsByView: RowsByView,
  identity: { snapshotId: string; asAt: MonthKey },
): AssembledOccupation[] {
  const apply = handlers(identity.asAt);
  const present = presentCodes(rowsByView, identity.asAt);
  const tagged = (Object.keys(rowsByView) as ViewId[])
    .flatMap((view) => rowsByView[view].map((row) => ({ view, row })))
    .filter(({ row }) => present.has(row.code))
    .sort((a, b) => a.row.asAt.localeCompare(b.row.asAt));
  const builders = new Map<string, Builder>();
  for (const { view, row } of tagged) {
    let builder = builders.get(row.code);
    if (!builder) {
      builder = newBuilder(row, identity);
      builders.set(row.code, builder);
    }
    builder.core.name = row.name;
    apply[view](builder, row, view);
  }
  return [...builders.values()]
    .sort((a, b) => a.core.code.localeCompare(b.core.code))
    .map((builder) => {
      finishPool(builder, identity.asAt);
      return { core: builder.core, detail: builder.detail };
    });
}
