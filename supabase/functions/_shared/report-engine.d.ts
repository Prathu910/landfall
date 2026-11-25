// Types for report-engine.js, the bundle of src/lib/report-issue/server-entry.ts
// (npm run engine:bundle). Self-contained on purpose: deno check cannot follow
// src/lib's extensionless imports. The functions treat a payload as opaque
// JSON and read only `meta` and `view.dataMonth`; the site's types are in
// src/lib/report-issue/payload.ts and src/lib/outlook/free-result.ts.

export type ReportMeta = {
  reportNo: string;
  version: number;
  /** ISO timestamps. */
  issuedAt: string;
  correctableUntil: string;
  revisionsLeft: number;
};

export type ReportPayload = {
  schema: 1;
  meta: ReportMeta | null;
  view: { dataMonth: string; [k: string]: unknown };
  [k: string]: unknown;
};

/** The full answers, as parseProfile accepts them. */
export type Profile = Record<string, unknown> & {
  occupation: string;
  name: string;
};

export type FreeResult =
  | { kind: "stamps"; dataMonth: string; [k: string]: unknown }
  | { kind: "loading"; [k: string]: unknown }
  | {
      kind: "points-only";
      reason: "no-occupation" | "unavailable" | "dropped" | "load-failed";
      note: string | null;
      [k: string]: unknown;
    };

declare const engineDataBrand: unique symbol;

/** Validated month data for one occupation; only parseEngineData makes one. */
export type EngineData = { readonly [engineDataBrand]: true };

/** The files as fetched: the manifest, the index, state-rules.json, the core and detail (or null). */
export type RawEngineData = {
  manifest: unknown;
  index: unknown;
  rules: unknown;
  core: unknown;
  detail: unknown;
};

/** Null when any part fails its guard, or the detail is for another occupation. */
export function parseEngineData(raw: RawEngineData): EngineData | null;

export function parseProfile(value: unknown): Profile | null;

/** Throws when the data is for another occupation than the profile's. */
export function issuePayload(
  data: EngineData,
  profile: Profile,
  asOf: string,
  meta: ReportMeta,
): ReportPayload;

/** Throws when the data is for another occupation than the profile's. */
export function freeResult(
  data: EngineData,
  profile: Profile,
  asOf: string,
): FreeResult;
