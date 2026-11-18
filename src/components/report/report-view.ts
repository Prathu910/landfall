import type { Profile } from "@/lib/migration";
import type { OccupationIndexEntry } from "@/lib/data/types";
import { buildReportView, type ReportView } from "@/lib/report/report-view";
import {
  toScorecardData,
  type ReportOccupation,
} from "../data/report-occupation";
import { skippedRounds } from "../data/rounds-meta";

/** Adapts the loaded occupation to the reality check's view-models. */
export function reportView(input: {
  profile: Profile;
  asOf: string;
  occupation: ReportOccupation;
  index: OccupationIndexEntry[];
}): ReportView {
  const { profile, asOf, occupation, index } = input;
  const name = index.find((o) => o.code === profile.occupation)?.name;
  return buildReportView({
    occupationName: name ?? "your occupation",
    data: toScorecardData(occupation, profile.occupation, index),
    // A detail file that failed (or was never requested) will not arrive.
    detailUnavailable:
      occupation.status === "ready" &&
      occupation.detail.status !== "ready" &&
      occupation.detail.status !== "loading",
    profile,
    asOf,
    skippedRounds,
  });
}
