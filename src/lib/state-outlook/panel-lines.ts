import { formatDate } from "../migration";
import { closedLabel } from "./context";
import type { RuleCheck } from "./judge";
import type { StateOutcome, StreamResult } from "./outlook";
import type { Sourced, StateVisaRules, Stream } from "./rules-types";
import { isStale } from "./staleness";

// The "Can you apply?" lines of a state panel: one per rule check, each with
// a key that stays the same from build to build.

export type CanApplyLine = {
  key: string; // unique within the panel
  text: string;
  mark: "✓" | "✗" | "?";
  finding?: string; // why it failed or can't be confirmed (ruling P29)
  source?: string; // omitted when the line has no page to link
  checkedNote: string;
};

const MARKS: Record<RuleCheck["outcome"], CanApplyLine["mark"]> = {
  pass: "✓",
  fail: "✗",
  "needs-answer": "?",
  unverified: "?",
};

const NOT_VERIFIED = "Not yet verified on the official page";
const POINTS_CHECK_NOTE = "From your points check";
const PROGRAM_YEAR = "2026–27";

/** How fresh a rule is; stale wins over secondary. */
function ruleNote(
  rule: Pick<RuleCheck, "checkedAt" | "stale" | "verification">,
): string {
  if (rule.stale) {
    return `Last checked ${formatDate(rule.checkedAt)}; may have changed`;
  }
  if (rule.verification === "secondary") return NOT_VERIFIED;
  // Only the federal list check has no date: the list could not be read.
  if (rule.checkedAt === "") return "Not checked";
  return `checked ${formatDate(rule.checkedAt)}`;
}

/** A link only when there is a page to point to. */
function withSource(source: string): { source?: string } {
  return source === "" ? {} : { source };
}

// Ruling P29: a failed rule, or a verified, fresh rule the answers can't
// confirm, says why. A stale or secondary rule's note already does.
function findingOf(check: RuleCheck): { finding?: string } {
  const decided = !check.stale && check.verification === "verified";
  const shown =
    check.outcome === "fail" || (check.outcome === "unverified" && decided);
  return shown ? { finding: check.finding } : {};
}

function checkLine(check: RuleCheck, key: string): CanApplyLine {
  return {
    key,
    text:
      check.outcome === "needs-answer" && check.question
        ? check.question
        : check.label,
    mark: MARKS[check.outcome],
    ...findingOf(check),
    ...withSource(check.source),
    checkedNote:
      check.basis === "points-check" ? POINTS_CHECK_NOTE : ruleNote(check),
  };
}

function restrictionLine(
  restriction: Sourced<string>,
  key: string,
  asOf: string,
): CanApplyLine {
  return {
    key,
    text: `Restriction, not checked here: ${restriction.value.replace(/[.\s]+$/, "")}`,
    mark: "?",
    ...withSource(restriction.source),
    checkedNote: ruleNote({
      ...restriction,
      stale: isStale(restriction.checkedAt, asOf),
    }),
  };
}

function sameCheck(a: RuleCheck, b: RuleCheck): boolean {
  return (
    a.label === b.label && a.finding === b.finding && a.source === b.source
  );
}

// Ruling P29: every stream of a closed state failed, so say why each one
// did; one line when they all failed on the same rule.
function notOpenLines(streams: StreamResult[]): CanApplyLine[] {
  const firstFails = streams.flatMap((stream) => {
    const check = stream.checks.find((c) => c.outcome === "fail");
    return check === undefined ? [] : [{ stream, check }];
  });
  const [first] = firstFails;
  if (first === undefined) return [];
  if (firstFails.every(({ check }) => sameCheck(check, first.check))) {
    return [checkLine(first.check, "first-fail")];
  }
  return firstFails.map(({ stream, check }) => ({
    ...checkLine(check, `${stream.streamId}:first-fail`),
    text: stream.name,
  }));
}

function isSecondaryClosure(stream: Stream | undefined): boolean {
  return (
    stream?.status.value === "closed" &&
    stream.status.verification === "secondary"
  );
}

function decidingLines(
  outcome: StateOutcome,
  deciding: StreamResult,
  stream: Stream | undefined,
  asOf: string,
): CanApplyLine[] {
  const lines: CanApplyLine[] = [];
  const id = deciding.streamId;
  let checks = deciding.checks.map((check, i) => ({ check, i }));
  // A secondary closure is never decisive, so say it before anything else and
  // drop the stream's own (duplicate) status check.
  if (stream !== undefined && isSecondaryClosure(stream)) {
    lines.push({
      key: `${id}:closure`,
      text: `Reported closed for ${outcome.visa} in ${PROGRAM_YEAR}, not yet verified on the official page`,
      mark: "?",
      source: stream.status.source,
      checkedNote: NOT_VERIFIED,
    });
    checks = checks.filter(
      ({ check }) => check.label !== closedLabel(PROGRAM_YEAR),
    );
  }
  lines.push(...checks.map(({ check, i }) => checkLine(check, `${id}:${i}`)));
  if (stream?.restriction !== undefined) {
    lines.push(restrictionLine(stream.restriction, `${id}:restriction`, asOf));
  }
  return lines;
}

/** The panel's "Can you apply?" lines; `rules` is undefined when none are recorded. */
export function canApplyLines(
  outcome: StateOutcome,
  rules: StateVisaRules | undefined,
  asOf: string,
): CanApplyLine[] {
  const deciding = outcome.deciding;
  if (deciding === null) {
    return [
      {
        key: "no-rules",
        text: outcome.reasonText,
        mark: "?",
        checkedNote: NOT_VERIFIED,
      },
    ];
  }
  if (outcome.group === "not-open") return notOpenLines(outcome.streams);
  const stream = rules?.streams.find((s) => s.id === deciding.streamId);
  return decidingLines(outcome, deciding, stream, asOf);
}
