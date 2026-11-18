import type { StateRules } from "./rules-types";

const DAY_MS = 86_400_000;

function utcDay(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / DAY_MS;
}

/** True when `checkedAt` is more than `maxDays` calendar days before `asOf`. Unparseable dates are stale: unknown never passes as fresh. */
export function isStale(
  checkedAt: string,
  asOf: string,
  maxDays = 60,
): boolean {
  const age = utcDay(asOf) - utcDay(checkedAt);
  return Number.isNaN(age) || age > maxDays;
}

/** Paths of rules checked more than `maxDays` before `buildDate` (a warning, not a failure). */
export function staleRules(
  rules: StateRules,
  buildDate: string,
  maxDays = 45,
): { path: string; checkedAt: string }[] {
  const out: { path: string; checkedAt: string }[] = [];
  const check = (path: string, rule: { checkedAt: string } | undefined) => {
    if (rule && isStale(rule.checkedAt, buildDate, maxDays)) {
      out.push({ path, checkedAt: rule.checkedAt });
    }
  };
  for (const r of rules.rules) {
    const base = `${r.state}/${r.visa}`;
    check(`${base}/selectionSystem`, r.selectionSystem);
    check(`${base}/ownScoreSystem`, r.ownScoreSystem);
    for (const s of r.streams) {
      const sp = `${base}/${s.id}`;
      check(`${sp}/cohorts`, s.cohorts);
      check(`${sp}/status`, s.status);
      check(`${sp}/restriction`, s.restriction);
      check(`${sp}/occupations`, s.occupations);
      s.requirements.forEach((q, i) => check(`${sp}/requirements/${i}`, q));
    }
  }
  return out;
}
