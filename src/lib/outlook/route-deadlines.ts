import { formatDate } from "../migration";
import type { Loss } from "./improve";

export type RouteDeadline = {
  date: string;
  title: string;
  sub: string;
  afterStep: number; // index of the step it follows
};

/** A step's date; null means now. */
type Timed = { date: string | null };

/**
 * Reads the title shapes made by losses.ts: "Your 33rd birthday, 9 Aug 2027: −5"
 * and "English test expires, 2 Feb 2028". route-deadlines.test.ts pins them.
 */
export function deadlineTitle(loss: Loss): string {
  if (loss.kind === "points") {
    const age = loss.title.match(/\d+/)?.[0] ?? "";
    return `Turns ${age}: −${loss.from.points - loss.to.points}`;
  }
  return loss.title.replace(/, \d{1,2} \w{3} \d{4}$/, "");
}

/**
 * The last step that happens on or before the loss. Steps without a date
 * happen now; the final step is the outcome and comes after every loss.
 */
export function followedStep(
  steps: Timed[],
  date: string,
  asOf: string,
): number {
  let after = 0;
  steps.slice(0, -1).forEach((s, index) => {
    if ((s.date ?? asOf) <= date) after = index;
  });
  return after;
}

export function buildDeadlines(
  losses: Loss[],
  steps: Timed[],
  asOf: string,
): RouteDeadline[] {
  return losses.map((loss) => ({
    date: loss.date,
    title: deadlineTitle(loss),
    sub: formatDate(loss.date),
    afterStep: followedStep(steps, loss.date, asOf),
  }));
}
