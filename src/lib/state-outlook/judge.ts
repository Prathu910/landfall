import { formatDate } from "../migration";
import type { Profile } from "../migration";
import { unverified } from "./context";
import type { Outcome, Verdict } from "./context";
import type { RelatedWork, Sourced, Verification } from "./rules-types";
import { isStale } from "./staleness";

export type RuleCheck = {
  label: string;
  outcome: "pass" | "fail" | "needs-answer" | "unverified";
  // The deciding fact, short (ruling P29): why it failed or can't be
  // confirmed, the topic of a missing answer, or the rule met.
  finding: string;
  source: string;
  checkedAt: string;
  stale: boolean;
  verification: Verification; // of the rule behind the check
  question?: string;
  field?: keyof Profile; // the profile answer the question fills in
  related?: RelatedWork; // which work counts, for a work-months question
  // Decided by the user's own points check, not by a state rule page.
  basis?: "points-check";
};

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

/** A verdict as a check, carrying only the optional fields it has. */
export function toCheck(
  label: string,
  verdict: Verdict,
  origin: Pick<RuleCheck, "source" | "checkedAt" | "stale" | "verification">,
): RuleCheck {
  const check: RuleCheck = {
    label,
    outcome: verdict.outcome,
    finding: verdict.finding,
    ...origin,
  };
  if (verdict.question !== undefined) check.question = verdict.question;
  if (verdict.field !== undefined) check.field = verdict.field;
  if (verdict.related !== undefined) check.related = verdict.related;
  return check;
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
): RuleCheck {
  const stale = isStale(provenance.checkedAt, asOf, MAX_AGE_DAYS);
  let verdict: Verdict;
  if (stale) {
    verdict = unverified(staleFinding(provenance.checkedAt));
  } else if (provenance.verification === "secondary") {
    verdict = unverified("Rules not yet verified on the official page");
  } else {
    verdict = decide();
  }
  return toCheck(label, verdict, {
    source: provenance.source,
    checkedAt: provenance.checkedAt,
    stale,
    verification: provenance.verification,
  });
}
