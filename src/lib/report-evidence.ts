import { countInterval, type Interval } from "./pool";

export type VisaPathway = "189" | "190" | "491";
export type RoundEvidence = { date: string; cutoff: number | null };
export type TrendEvidence = { date: string; total: Interval };
export type PathwayEvidence = {
  visa: VisaPathway;
  total: Interval;
  points: { score: number; count: string }[];
};
export type OccupationEvidence = {
  code: string;
  name: string;
  rounds: RoundEvidence[];
  trend: TrendEvidence[];
  pathways: PathwayEvidence[];
};
/** Difference of bounded published counts. No midpoint is invented for masked cells. */
export function netPoolChange(previous: Interval, current: Interval): Interval {
  return { min: current.min - previous.max, max: current.max - previous.min };
}

/** Validate imported relationships without inferring or revealing suppressed cells. */
export function validateOccupationEvidence(
  occupation: OccupationEvidence,
): string[] {
  const issues: string[] = [];
  const dates = occupation.trend.map((row) => row.date);
  if (
    new Set(dates).size !== dates.length ||
    dates.some((date, i) => i > 0 && date <= dates[i - 1])
  ) {
    issues.push("Monthly dates must be unique and increasing");
  }
  for (const row of occupation.trend) {
    if (row.total.min < 0 || row.total.max < row.total.min)
      issues.push(`Invalid total at ${row.date}`);
  }
  for (const pathway of occupation.pathways) {
    const scores = new Set<number>();
    let min = 0,
      max = 0;
    for (const row of pathway.points) {
      if (scores.has(row.score))
        issues.push(`Duplicate ${pathway.visa} score ${row.score}`);
      scores.add(row.score);
      const interval = countInterval(row.count);
      min += interval.min;
      max += interval.max;
    }
    if (min > pathway.total.max || max < pathway.total.min) {
      issues.push(
        `${pathway.visa} aggregate is inconsistent with its score intervals`,
      );
    }
  }
  return issues;
}
