import type { OccupationEvidence } from "../../lib/report-evidence";
import {
  toOccupationEvidence,
  toPoolOccupation,
  type PoolOccupation,
} from "../../lib/data/legacy";
import type { OccupationLoad } from "./use-occupation-core";

/** The nominated occupation's published data, as the report reads it. */
export type ReportOccupation =
  | { status: "loading" }
  | {
      status: "ready";
      pool: PoolOccupation | null; // null: no 189 pool published
      evidence: OccupationEvidence;
    }
  | { status: "unavailable" };

/** An occupation that was never requested has no data to show, like a failed load. */
export function toReportOccupation(load: OccupationLoad): ReportOccupation {
  switch (load.status) {
    case "loading":
      return { status: "loading" };
    case "ready":
      return {
        status: "ready",
        pool: toPoolOccupation(load.core),
        evidence: toOccupationEvidence(load.core),
      };
    default:
      return { status: "unavailable" };
  }
}
