"use client";

import { isOccupationCore, isOccupationDetail } from "../../lib/data/guards";
import { occupationDataUrl } from "../../lib/data/occupation-url";
import type {
  OccupationCore,
  OccupationDetail,
  OccupationIndexEntry,
} from "../../lib/data/types";
import { useValidatedRecord } from "./use-validated-record";

export type OccupationLoad =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; core: OccupationCore }
  | { status: "unavailable" };

export type DetailLoad =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; detail: OccupationDetail }
  | { status: "unavailable" };

/**
 * `index` must be a stable, module-level array (see `occupationIndex`): the
 * fetch effect depends on it.
 */
export function useOccupationCore(
  code: string | null,
  index: OccupationIndexEntry[],
): OccupationLoad {
  const load = useValidatedRecord(
    code !== null,
    code === null ? null : occupationDataUrl(code, index, "core"),
    isOccupationCore,
  );
  return load.status === "ready" ? { status: "ready", core: load.value } : load;
}

/** The detail file (state, cohort and history evidence); same rules as the core hook. */
export function useOccupationDetail(
  code: string | null,
  index: OccupationIndexEntry[],
): DetailLoad {
  const load = useValidatedRecord(
    code !== null,
    code === null ? null : occupationDataUrl(code, index, "detail"),
    isOccupationDetail,
  );
  return load.status === "ready"
    ? { status: "ready", detail: load.value }
    : load;
}
