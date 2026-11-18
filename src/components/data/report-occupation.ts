import type { OccupationEvidence } from "../../lib/report-evidence";
import {
  toOccupationEvidence,
  toPoolOccupation,
  type PoolOccupation,
} from "../../lib/data/legacy";
import type { OccupationIndexEntry } from "../../lib/data/types";
import type { OccupationCore } from "../../lib/data/types";
import type { DetailLoad, OccupationLoad } from "./use-occupation-core";

/** The nominated occupation's published data, as the report reads it. */
export type ReportOccupation =
  | { status: "loading" }
  | {
      status: "ready";
      pool: PoolOccupation | null; // null: no 189 pool published
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
        pool: toPoolOccupation(load.core),
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

const POOL_UNAVAILABLE_MESSAGE: Record<UnavailableReason, string> = {
  notIndexed:
    "This occupation is not in the imported snapshot. Your points are available; no pool comparison has been invented.",
  noData:
    "No submitted EOIs are published for this occupation in this snapshot. Your points are available; no pool comparison has been invented.",
  loadFailed:
    "Published data for this occupation could not be loaded. Your points are still calculated; try again later.",
};

export function poolUnavailableMessage(
  code: string,
  index: OccupationIndexEntry[],
): string {
  return POOL_UNAVAILABLE_MESSAGE[unavailableReason(code, index)];
}
