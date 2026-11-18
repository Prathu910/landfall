import type { OccupationEvidence } from "../../lib/report-evidence";
import { toOccupationEvidence } from "../../lib/data/legacy";
import type {
  OccupationCore,
  OccupationIndexEntry,
} from "../../lib/data/types";
import type { ScorecardData } from "../../lib/report/scorecard";
import type { DetailLoad, OccupationLoad } from "./use-occupation-core";

/** The nominated occupation's published data, as the report reads it. */
export type ReportOccupation =
  | { status: "loading" }
  | {
      status: "ready";
      evidence: OccupationEvidence;
      core: OccupationCore;
      detail: DetailLoad;
    }
  | { status: "unavailable" };

/** An occupation that was never requested has no data to show, like a failed load. */
export function toReportOccupation(
  load: OccupationLoad,
  detail: DetailLoad,
): ReportOccupation {
  switch (load.status) {
    case "loading":
      return { status: "loading" };
    case "ready":
      return {
        status: "ready",
        evidence: toOccupationEvidence(load.core),
        core: load.core,
        detail,
      };
    default:
      return { status: "unavailable" };
  }
}

/**
 * Why an "unavailable" occupation has no data: it is not in the snapshot (or
 * is the points-only choice), it is in the snapshot with no published EOIs,
 * or its published file failed to load (a network fact, not a data fact).
 */
export type UnavailableReason = "notIndexed" | "noData" | "loadFailed";

export function unavailableReason(
  code: string,
  index: OccupationIndexEntry[],
): UnavailableReason {
  const entry = index.find((e) => e.code === code);
  if (!entry) return "notIndexed";
  return entry.hasData ? "loadFailed" : "noData";
}

/** The scorecard's view of the occupation; the detail joins once it has loaded. */
export function toScorecardData(
  occupation: ReportOccupation,
  code: string,
  index: OccupationIndexEntry[],
): ScorecardData {
  switch (occupation.status) {
    case "ready":
      return {
        kind: "ready",
        core: occupation.core,
        detail:
          occupation.detail.status === "ready"
            ? occupation.detail.detail
            : null,
      };
    case "loading":
      return { kind: "none", reason: "loading" };
    default:
      return { kind: "none", reason: unavailableReason(code, index) };
  }
}
