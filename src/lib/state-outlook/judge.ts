import { formatDate } from "../migration";
import type { Profile } from "../migration";
import { unverified } from "./context";
import type { Outcome, Verdict } from "./context";
import type { RelatedWork, Sourced } from "./rules-types";
import { isStale } from "./staleness";

export type RuleCheck = {
  label: string;
  outcome: "pass" | "fail" | "needs-answer" | "unverified";
  source: string;
  checkedAt: string;
  stale: boolean;
  question?: string;
  field?: keyof Profile; // the profile answer the question fills in
  related?: RelatedWork; // which work counts, for a work-months question
  // Decided by the user's own points check, not by a state rule page.
  basis?: "points-check";
};

export type Judged = { check: RuleCheck; finding: string };
export type Provenance = Pick<
  Sourced<unknown>,
  "source" | "checkedAt" | "verification"
>;

// A rule checked longer ago than this before `asOf` is treated as unverified.
const MAX_AGE_DAYS = 60;

const SEVERITY: Record<Outcome, number> = {
  pass: 0,
  "needs-answer": 1,
  unverified: 2,
  fail: 3,
};

/** Higher is worse: fail > unverified > needs-answer > pass. */
export function severity(outcome: Outcome): number {
  return SEVERITY[outcome];
}

function staleFinding(checkedAt: string): string {
  const date = formatDate(checkedAt);
  return date === "—"
    ? "Rules check date unknown; may have changed"
    : `Rules last checked ${date}; may have changed`;
}

/**
 * A stale or secondary rule never decides: it is unverified whatever the
 * user's answers. Only a verified, fresh rule reaches `decide`.
 */
export function judge(
  provenance: Provenance,
  label: string,
  asOf: string,
  decide: () => Verdict,
): Judged {
  const stale = isStale(provenance.checkedAt, asOf, MAX_AGE_DAYS);
  let verdict: Verdict;
  if (stale) {
    verdict = unverified(staleFinding(provenance.checkedAt));
  } else if (provenance.verification === "secondary") {
    verdict = unverified("Rules not yet verified on the official page");
  } else {
    verdict = decide();
  }
  const check: RuleCheck = {
    label,
    outcome: verdict.outcome,
    source: provenance.source,
    checkedAt: provenance.checkedAt,
    stale,
  };
  if (verdict.question !== undefined) check.question = verdict.question;
  if (verdict.field !== undefined) check.field = verdict.field;
  if (verdict.related !== undefined) check.related = verdict.related;
  return { check, finding: verdict.finding };
}
