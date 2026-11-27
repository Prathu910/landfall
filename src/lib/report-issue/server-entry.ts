// The only entry of the server engine bundle (npm run engine:bundle), which
// the Supabase functions import from supabase/functions/_shared/report-engine.js.
import { reportSource } from "../data/report-source";
import type { Profile } from "../migration";
import { buildFreeResult } from "../outlook/free-result";
import type { FreeResult } from "../outlook/free-result";
import { buildReportPayload } from "./build";
import type { EngineData } from "./engine-data";
import { setLiveData } from "./live-json";
import type { ReportMeta, ReportPayload } from "./payload";

export { parseEngineData } from "./engine-data";
export { parseProfile } from "../profile-guard";

/** Loads the month's manifest and index for a build on this profile's data. */
function loadMonth(data: EngineData, profile: Profile): void {
  if (profile.occupation !== data.core.code) {
    throw new Error(
      `The engine data is for ${data.core.code}, the profile for ${profile.occupation || "no occupation"}`,
    );
  }
  setLiveData(data.manifest, data.index);
}

/** The full report, as /check/ builds it: the source dates to the manifest's month. */
export function issuePayload(
  data: EngineData,
  profile: Profile,
  asOf: string,
  meta: ReportMeta,
): ReportPayload {
  loadMonth(data, profile);
  return buildReportPayload({
    profile,
    asOf,
    core: data.core,
    detail: data.detail,
    rules: data.rules,
    source: reportSource(data.manifest.asAt, data.manifest),
    meta,
  });
}

/** The free points and stamps shown before payment. */
export function freeResult(
  data: EngineData,
  profile: Profile,
  asOf: string,
): FreeResult {
  loadMonth(data, profile);
  return buildFreeResult({
    profile,
    asOf,
    rules: data.rules,
    occupation: { status: "ready", core: data.core, detail: data.detail },
  });
}
