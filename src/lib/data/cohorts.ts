import { countIn } from "./published-count";
import type {
  EoiStatus,
  Interval,
  MonthKey,
  OccupationDetail,
  Visa,
} from "./types";

export type CohortOutcome = {
  submittedMonth: MonthKey | "older";
  counts: Record<EoiStatus, Interval>;
};

const STATUSES: EoiStatus[] = [
  "SUBMITTED",
  "INVITED",
  "LODGED",
  "HOLD",
  "CLOSED",
];

export function cohortOutcomes(
  detail: OccupationDetail,
  visa: Visa,
  submittedMonth: MonthKey,
): CohortOutcome | undefined {
  const cohort = detail.cohorts[visa]?.[submittedMonth];
  if (!cohort) return undefined;
  const counts = {} as Record<EoiStatus, Interval>;
  for (const status of STATUSES) {
    counts[status] = countIn(cohort as Record<string, string>, status) ?? {
      min: 0,
      max: 0,
    };
  }
  return { submittedMonth, counts };
}
