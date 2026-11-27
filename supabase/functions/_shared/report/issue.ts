// Builds what an issue RPC stores: the payload, a fresh link token (only
// its hash and its encrypted copy are sent), and the data it came from.
// The SQL writes the real meta (report number, dates) into the payload.

import {
  issuePayload,
  type Profile,
  type ReportMeta,
} from "../report-engine.js";
import { encryptToken, newToken } from "./crypto.ts";
import { dataMonthOf, type LoadedData, storedEngineData } from "./data.ts";
import { type Deps, setting } from "./endpoint.ts";

const DAY = 24 * 60 * 60 * 1000;

/** Placeholder meta: report_with_meta in SQL replaces it. */
export function pendingMeta(nowMs: number, version: number): ReportMeta {
  return {
    reportNo: "pending",
    version,
    issuedAt: new Date(nowMs).toISOString(),
    correctableUntil: new Date(nowMs + 7 * DAY).toISOString(),
    revisionsLeft: 4 - version,
  };
}

export type ReportInput = {
  token_hash: string;
  token_enc: string;
  payload: unknown;
  engine_data: unknown;
  data_as_at: string;
};

/** Throws (the caller answers invalid or busy) when the engine refuses the profile. */
export async function prepareReport(
  deps: Deps,
  loaded: LoadedData,
  profile: Profile,
  asOf: string,
): Promise<{ token: string; report: ReportInput }> {
  const payload = issuePayload(
    loaded.data,
    profile,
    asOf,
    pendingMeta(deps.now(), 1),
  );
  const { token, hash } = await newToken(deps.randomBytes);
  return {
    token,
    report: {
      token_hash: hash,
      token_enc: await encryptToken(token, setting(deps, "REPORT_TOKEN_KEY")),
      payload,
      engine_data: storedEngineData(loaded.raw),
      data_as_at: dataMonthOf(loaded.raw),
    },
  };
}
