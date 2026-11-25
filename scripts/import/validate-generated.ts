import {
  isManifest,
  isOccupationCore,
  isOccupationDetail,
} from "../../src/lib/data/guards";
import {
  parseCountText,
  sumIntervals,
} from "../../src/lib/data/published-count";
import type {
  CountText,
  Interval,
  Manifest,
  OccupationCore,
  ScoreCounts,
  Visa,
} from "../../src/lib/data/types";
import { snapshotIdFor, type GeneratedData } from "./generate";

const VISAS: Visa[] = ["189", "190", "491"];
const CORE_LIMIT_BYTES = 50 * 1024;
const DETAIL_LIMIT_BYTES = 250 * 1024;
const MAX_OCCUPATION_DROP = 0.1;

function scoreSum(scores: ScoreCounts | undefined): Interval {
  return sumIntervals(Object.values(scores ?? {}).map(parseCountText));
}

function overlaps(a: Interval, b: Interval): boolean {
  return a.min <= b.max && b.min <= a.max;
}

function outside(
  core: OccupationCore,
  visa: Visa,
  month: string,
  status: "SUBMITTED" | "INVITED",
  total: CountText,
  sum: Interval,
): string[] {
  if (overlaps(parseCountText(total), sum)) return [];
  const rows = status === "INVITED" ? "invited score-row sum" : "score-row sum";
  return [
    `${core.code} visa ${visa} ${month}: ${status} ${total} is outside the ${rows} ${sum.min}–${sum.max}`,
  ];
}

/**
 * The latest SUBMITTED total (points hidden) must fit the pool's score rows.
 * The status-history table is fully paged, so a missing row is a zero.
 */
function checkPool(core: OccupationCore): string[] {
  return VISAS.flatMap((visa) => {
    const pool = core.pool[visa];
    const submitted = core.statusHistory[visa]?.[core.asAt]?.SUBMITTED;
    if (!pool && submitted === undefined) return [];
    const issues: string[] = [];
    if (pool && pool.total !== (submitted ?? "0")) {
      issues.push(
        `${core.code} visa ${visa} ${core.asAt}: pool total ${pool.total} differs from status history SUBMITTED ${submitted ?? "0"}`,
      );
    }
    const total = pool?.total ?? submitted ?? "0";
    const sum = scoreSum(pool?.byScore);
    return [
      ...issues,
      ...outside(core, visa, core.asAt, "SUBMITTED", total, sum),
    ];
  });
}

/** Each month's INVITED total must fit that month's invited score rows. */
function checkInvited(core: OccupationCore): string[] {
  return VISAS.flatMap((visa) => {
    const history = core.statusHistory[visa] ?? {};
    const byScore = core.invitedByScore[visa] ?? {};
    const months = [
      ...new Set([...Object.keys(history), ...Object.keys(byScore)]),
    ].sort();
    return months.flatMap((month) =>
      outside(
        core,
        visa,
        month,
        "INVITED",
        history[month]?.INVITED ?? "0",
        scoreSum(byScore[month]),
      ),
    );
  });
}

/** The snapshot a record must carry: the manifest's, or its last month if dropped. */
function expectedSnapshot(
  data: GeneratedData,
  code: string,
): { snapshotId: string; asAt: string } {
  const lastAsAt = data.index.find((entry) => entry.code === code)?.lastAsAt;
  return lastAsAt
    ? { snapshotId: snapshotIdFor(lastAsAt), asAt: lastAsAt }
    : { snapshotId: data.manifest.snapshotId, asAt: data.manifest.asAt };
}

/** A dropped mark must name a month before this one: the code was in older data. */
function checkDropMarks(data: GeneratedData): string[] {
  return data.index.flatMap(({ code, lastAsAt }) =>
    lastAsAt !== undefined && lastAsAt >= data.manifest.asAt
      ? [
          `${code}: lastAsAt ${lastAsAt} is not before ${data.manifest.asAt} (an occupation missing from data it should be in)`,
        ]
      : [],
  );
}

function checkRecords(data: GeneratedData): string[] {
  const issues: string[] = [];
  if (!isManifest(data.manifest)) {
    issues.push("Manifest fails the schema guard");
  }
  const records = [
    ...data.cores.map((record) => ({ kind: "core", record })),
    ...data.details.map((record) => ({ kind: "detail", record })),
  ];
  for (const { kind, record } of records) {
    const valid =
      kind === "core" ? isOccupationCore(record) : isOccupationDetail(record);
    if (!valid) {
      issues.push(`${record.code}: ${kind} record fails the schema guard`);
    }
    const expected = expectedSnapshot(data, record.code);
    if (
      record.snapshotId !== expected.snapshotId ||
      record.asAt !== expected.asAt
    ) {
      issues.push(
        `${record.code}: ${kind} snapshot ${record.snapshotId} does not match ${expected.snapshotId}`,
      );
    }
  }
  return issues;
}

function duplicates(codes: string[], where: string): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const code of codes) {
    if (seen.has(code)) repeated.add(code);
    seen.add(code);
  }
  return [...repeated].map(
    (code) => `Duplicate occupation code ${code} in ${where}`,
  );
}

function checkCodes(data: GeneratedData): string[] {
  const indexCodes = data.index.map((entry) => entry.code);
  const sets = {
    index: new Set(indexCodes),
    core: new Set(data.cores.map((core) => core.code)),
    detail: new Set(data.details.map((detail) => detail.code)),
  };
  const issues = [
    ...duplicates(indexCodes, "the index"),
    ...duplicates(
      data.cores.map((core) => core.code),
      "the core records",
    ),
    ...duplicates(
      data.details.map((detail) => detail.code),
      "the detail records",
    ),
  ];
  for (const kind of ["core", "detail"] as const) {
    for (const code of sets.index) {
      if (!sets[kind].has(code)) issues.push(`${code}: missing ${kind} record`);
    }
    for (const code of sets[kind]) {
      if (!sets.index.has(code)) {
        issues.push(`${code}: ${kind} record is not in the index`);
      }
    }
  }
  return issues;
}

function checkContinuity(
  data: GeneratedData,
  previous: Manifest | null,
): string[] {
  const { asAt } = data.manifest;
  const issues: string[] = [];
  if (previous && asAt < previous.asAt) {
    issues.push(
      `asAt ${asAt} is older than the previous snapshot ${previous.asAt}`,
    );
  }
  if (data.newestRawMonth && asAt < data.newestRawMonth) {
    issues.push(
      `asAt ${asAt} is older than the newest raw month ${data.newestRawMonth}`,
    );
  }
  // Dropped occupations are carried forward, so only current codes count.
  const current = (m: Manifest) =>
    m.occupations.filter((entry) => entry.lastAsAt === undefined).length;
  const count = current(data.manifest);
  const before = previous ? current(previous) : 0;
  if (count < before * (1 - MAX_OCCUPATION_DROP)) {
    issues.push(
      `Occupation count fell from ${before} to ${count} (more than 10%)`,
    );
  }
  return issues;
}

function checkSizes(data: GeneratedData): string[] {
  const records = [
    ...data.cores.map((record) => ({
      kind: "core",
      record,
      limit: CORE_LIMIT_BYTES,
    })),
    ...data.details.map((record) => ({
      kind: "detail",
      record,
      limit: DETAIL_LIMIT_BYTES,
    })),
  ];
  return records.flatMap(({ kind, record, limit }) => {
    const bytes = Buffer.byteLength(JSON.stringify(record));
    return bytes > limit
      ? [`${record.code}: ${kind} file is ${bytes} bytes, over ${limit}`]
      : [];
  });
}

/** Returns every problem found; empty means the data may be written. */
export function validateGenerated(
  data: GeneratedData,
  previousManifest: Manifest | null,
): string[] {
  // Count arithmetic runs only on cores whose counts passed the guard.
  const checkable = data.cores.filter(isOccupationCore);
  return [
    ...checkRecords(data),
    ...checkCodes(data),
    ...checkDropMarks(data),
    ...checkable.flatMap(checkPool),
    ...checkable.flatMap(checkInvited),
    ...checkContinuity(data, previousManifest),
    ...checkSizes(data),
  ];
}
