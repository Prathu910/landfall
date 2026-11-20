import { ageOnDate, type Profile, type PointsResult } from "../migration";
import { type CalculationSummary } from "./contract";
export function calculationSummary(
  profile: Profile,
  result: PointsResult,
  asOf: string,
  snapshotDate: string,
): CalculationSummary {
  const age = ageOnDate(profile.dob, asOf);
  if (age === null) throw new Error("A valid date of birth is required.");
  return {
    occupation_code: /^[1-9]\d{5}$/.test(profile.occupation)
      ? profile.occupation
      : "points-only",
    age_band:
      age < 18
        ? "under-18"
        : age < 25
          ? "18-24"
          : age < 33
            ? "25-32"
            : age < 40
              ? "33-39"
              : age < 45
                ? "40-44"
                : "45+",
    location: profile.onshore ? "onshore" : "offshore",
    base_points: result.base,
    points_190: result.subclass190,
    points_491: result.subclass491,
    snapshot_id: `skillselect-${snapshotDate}`,
  };
}
