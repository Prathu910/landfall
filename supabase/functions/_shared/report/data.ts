// The live month's data, read from the site's own static files at run time
// (the monthly job can't redeploy Functions). A missing or unreadable core
// is "no data" (null); an unreachable site throws, so callers answer busy.

import { record } from "../../../../src/lib/submissions/contract.ts";
import {
  type EngineData,
  parseEngineData,
  type RawEngineData,
} from "../report-engine.js";

const TIMEOUT_MS = 10_000;
const CODE = /^\d{6}$/;

export type LoadedData = { data: EngineData; raw: RawEngineData };

/** What a report keeps of its data (reports.engine_data): enough to rebuild version 1's month. */
export type StoredEngineData = {
  core: unknown;
  detail: unknown;
  checkedAt: string;
};

const MISSING = Symbol("missing");

async function getJson(
  url: string,
  fetcher: typeof fetch,
  missingOk: boolean,
): Promise<unknown> {
  let result: Response;
  try {
    result = await fetcher(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new Error("Site data unavailable");
  }
  if (missingOk && result.status === 404) {
    await result.body?.cancel();
    return MISSING;
  }
  if (!result.ok) {
    await result.body?.cancel();
    throw new Error(`Site data unavailable (HTTP ${result.status})`);
  }
  try {
    return await result.json();
  } catch {
    if (missingOk) return MISSING;
    throw new Error("Site data unreadable");
  }
}

function dataUrl(siteUrl: string, path: string): string {
  return `${siteUrl.replace(/\/$/, "")}/data/${path}`;
}

/** The month-wide files: the manifest, the index and the state rules. */
export async function loadMonth(
  siteUrl: string,
  fetcher: typeof fetch,
): Promise<{ manifest: unknown; index: unknown; rules: unknown }> {
  const [manifest, index, rules] = await Promise.all(
    ["manifest.json", "occupation-index.json", "state-rules.json"].map((path) =>
      getJson(dataUrl(siteUrl, path), fetcher, false),
    ),
  );
  return { manifest, index, rules };
}

/**
 * One occupation's engine data for the live month, or null when it has no
 * sellable data: no core, a core that fails its guard, or a core from
 * another month than the manifest (ruling R4).
 */
export async function loadEngineData(
  siteUrl: string,
  code: string,
  fetcher: typeof fetch,
): Promise<LoadedData | null> {
  if (!CODE.test(code)) return null;
  const [month, core, detail] = await Promise.all([
    loadMonth(siteUrl, fetcher),
    getJson(dataUrl(siteUrl, `occupations/${code}.json`), fetcher, true),
    getJson(dataUrl(siteUrl, `occupations/${code}.detail.json`), fetcher, true),
  ]);
  if (core === MISSING) return null;
  if (!record(core) || !record(month.manifest)) return null;
  if (month.manifest.asAt !== core.asAt) return null;
  const raw: RawEngineData = {
    ...month,
    core,
    detail: detail === MISSING ? null : detail,
  };
  const data = parseEngineData(raw);
  return data ? { data, raw } : null;
}

export function storedEngineData(raw: RawEngineData): StoredEngineData {
  const manifest = raw.manifest as { checkedAt: string };
  return { core: raw.core, detail: raw.detail, checkedAt: manifest.checkedAt };
}

/** The data month a report is built from: the manifest's (and so the core's) asAt. */
export function dataMonthOf(raw: RawEngineData): string {
  return (raw.manifest as { asAt: string }).asAt;
}

/**
 * Version 1's data for a revision: the stored core and detail, with the
 * live index and state rules, and the live manifest pinned to the stored
 * month and check date, so the data month and source dates never change.
 * Null when the stored data no longer parses; site down throws.
 */
export async function rebuildEngineData(
  siteUrl: string,
  stored: unknown,
  fetcher: typeof fetch,
): Promise<EngineData | null> {
  if (!record(stored) || !record(stored.core)) return null;
  const month = await loadMonth(siteUrl, fetcher);
  if (!record(month.manifest)) return null;
  const manifest = {
    ...month.manifest,
    asAt: stored.core.asAt,
    checkedAt: stored.checkedAt ?? month.manifest.checkedAt,
  };
  return parseEngineData({
    ...month,
    manifest,
    core: stored.core,
    detail: stored.detail ?? null,
  });
}
