import type { TimelineEvent } from "../migration";

export type ChangeItem = {
  label: string;
  effect: string;
  href: "#timeline" | "#scenarios";
};

const EVENT_COUNT = 2;
const SCENARIO_COUNT = 2;

function signed(delta: number): string {
  return delta < 0 ? `−${Math.abs(delta)}` : `+${delta}`;
}

/** The next dated points changes, then the biggest gains a scenario offers. */
export function buildWhatCouldChange(
  events: TimelineEvent[],
  scenarios: { label: string; delta: number }[],
  asOf: string,
): ChangeItem[] {
  const upcoming = events
    .filter((e) => e.date > asOf && e.delta !== undefined && e.delta !== 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, EVENT_COUNT)
    .map((e): ChangeItem => ({
      label: e.title,
      effect: signed(e.delta as number),
      href: "#timeline",
    }));
  const gains = scenarios
    .filter((s) => s.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, SCENARIO_COUNT)
    .map((s): ChangeItem => ({
      label: s.label,
      effect: signed(s.delta),
      href: "#scenarios",
    }));
  return [...upcoming, ...gains];
}
