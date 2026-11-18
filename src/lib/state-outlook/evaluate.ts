import {
  cohortIn,
  fail,
  joinWords,
  pass,
  possessive,
  STATE_NAMES,
  STATE_QUESTION,
  unverified,
} from "./context";
import type { Outcome, StreamContext, Verdict } from "./context";
import { judge, severity } from "./judge";
import type { Judged, Provenance, RuleCheck } from "./judge";
import { judgeRequirement, requirementLabel } from "./requirements";
import type {
  Cohort,
  FederalList,
  ImportedListEntry,
  OccupationListRef,
  Requirement,
  Sourced,
  Stream,
} from "./rules-types";

export type { StreamContext } from "./context";
export type { RuleCheck } from "./judge";
export { severity } from "./judge";

export type StreamResult = {
  streamId: string;
  name: string;
  outcome: RuleCheck["outcome"];
  checks: RuleCheck[];
};

/** A stream's result plus one short finding per check (same order). */
export type StreamEvaluation = { result: StreamResult; findings: string[] };

function federalLabel(ctx: StreamContext): string {
  return `On the federal occupation list for ${ctx.visa}`;
}

// Ruling P6: only a missing list is unknown; a code absent from it, or
// marked false, is federally ineligible.
function federalCheck(federal: FederalList, ctx: StreamContext): Judged {
  const label = federalLabel(ctx);
  // The federal list is imported from the official Home Affairs page.
  const provenance: Provenance = {
    source: federal.source,
    checkedAt: federal.checkedAt,
    verification: "verified",
  };
  return judge(provenance, label, ctx.asOf, () =>
    federal.entries[ctx.code]?.[ctx.visa] === true
      ? pass(label)
      : fail(`Not on the federal list for ${ctx.visa}`),
  );
}

function federalMissing(ctx: StreamContext): Judged {
  return {
    check: {
      label: federalLabel(ctx),
      outcome: "unverified",
      source: "",
      checkedAt: "",
      stale: false,
    },
    finding: "Federal occupation list not available",
  };
}

function statusCheck(stream: Stream, ctx: StreamContext): Judged {
  const status = stream.status.value;
  const year = ctx.programYear;
  const labels = {
    open: `Open in ${year}`,
    restricted: `Open in ${year}, with restrictions`,
    closed: `Closed in ${year}`,
    unknown: "Status not confirmed",
  };
  return judge(stream.status, labels[status], ctx.asOf, () => {
    // A restriction is applied through the stream's cohorts and requirements.
    if (status === "open" || status === "restricted") {
      return pass(labels[status]);
    }
    if (status === "closed") {
      return fail(`Closed for ${ctx.visa} in ${year}`);
    }
    return unverified("Status not confirmed on the official page");
  });
}

function cohortCheck(stream: Stream, ctx: StreamContext): Judged {
  const allowed = stream.cohorts.value;
  const name = STATE_NAMES[ctx.state];
  const phrases: Record<Cohort, string> = {
    "living-in-state": `in ${name}`,
    "living-in-other-state": "in another state",
    offshore: "offshore",
  };
  const label = `Open to those living ${joinWords(
    allowed.map((c) => phrases[c]),
    "or",
  )}`;
  return judge(stream.cohorts, label, ctx.asOf, () => {
    const cohort = cohortIn(ctx.profile, ctx.state);
    if (cohort === null) {
      const onshore = allowed.filter((c) => c !== "offshore");
      if (onshore.length === 2) return pass(label);
      if (onshore.length === 0) {
        return fail("Not open to those living in Australia");
      }
      return STATE_QUESTION;
    }
    if (allowed.includes(cohort)) return pass(label);
    const yours =
      cohort === "living-in-other-state"
        ? "elsewhere in Australia"
        : phrases[cohort];
    return fail(`Not open to those living ${yours}`);
  });
}

// Ruling P18: lists record onshore and offshore categories (residence is a
// stream rule), so any onshore cohort on the entry matches an onshore user.
// Ruling P20: a stream filter counts only tags recorded for this visa.
function listVerdict(
  entry: ImportedListEntry | undefined,
  streams: string[] | undefined,
  stream: Stream,
  ctx: StreamContext,
): Verdict {
  const list = `${possessive(ctx.state)} ${ctx.programYear} list for ${ctx.visa}`;
  const cohorts = entry?.[ctx.visa] ?? [];
  if (cohorts.length === 0) return fail(`Not on ${list}`);
  const onshore = ctx.profile.onshore;
  const matches = onshore
    ? cohorts.some((c) => c !== "offshore")
    : cohorts.includes("offshore");
  if (!matches) {
    const other = onshore ? "offshore" : "in Australia";
    return fail(`On ${list} only for those living ${other}`);
  }
  const tags = entry?.streams?.[ctx.visa] ?? [];
  if (streams !== undefined && !streams.some((t) => tags.includes(t))) {
    return fail(`Not on ${list} under ${stream.name}`);
  }
  return pass(`On ${list}`);
}

function olderDate(a: string, b: string): string {
  return a < b ? a : b;
}

function listCheck(
  stream: Stream,
  federal: FederalList,
  ctx: StreamContext,
): Judged {
  const rule = stream.occupations;
  const ref: OccupationListRef = rule.value;
  const owner = possessive(ctx.state);
  const year = ctx.programYear;
  switch (ref.kind) {
    case "list": {
      const label = `On ${owner} ${year} list for ${ctx.visa}`;
      const list = ctx.lists[ref.listId];
      if (list === undefined) {
        return judge(rule, label, ctx.asOf, () =>
          unverified(`${owner} occupation list is not available`),
        );
      }
      // An old import is as stale as an old rule.
      const provenance = {
        ...rule,
        checkedAt: olderDate(rule.checkedAt, list.checkedAt),
      };
      return judge(provenance, label, ctx.asOf, () =>
        listVerdict(list.entries[ctx.code], ref.streams, stream, ctx),
      );
    }
    case "all-federally-eligible": {
      const label = `Any occupation on the federal list for ${ctx.visa}`;
      return judge(rule, label, ctx.asOf, () =>
        federal.entries[ctx.code]?.[ctx.visa] === true
          ? pass(label)
          : fail(`Not on the federal list for ${ctx.visa}`),
      );
    }
    case "none-published":
      return judge(rule, `No ${year} occupation list published`, ctx.asOf, () =>
        unverified(`No ${year} occupation list published to check against`),
      );
    case "not-imported":
      return judge(rule, `On ${owner} occupation list`, ctx.asOf, () =>
        unverified(`${owner} occupation list is not checked here yet`),
      );
  }
}

function requirementCheck(
  rule: Sourced<Requirement>,
  stream: Stream,
  ctx: StreamContext,
): Judged {
  return judge(rule, requirementLabel(rule.value, ctx), ctx.asOf, () =>
    judgeRequirement(rule.value, stream.cohorts.value, ctx),
  );
}

function checksFor(stream: Stream, ctx: StreamContext): Judged[] {
  // Without the federal list nothing can be decided (ruling P6).
  if (ctx.federal === null) return [federalMissing(ctx)];
  return [
    federalCheck(ctx.federal, ctx),
    statusCheck(stream, ctx),
    cohortCheck(stream, ctx),
    listCheck(stream, ctx.federal, ctx),
    ...stream.requirements.map((rule) => requirementCheck(rule, stream, ctx)),
  ];
}

/** Every check of one stream; the stream's outcome is its worst check. */
export function evaluateStream(
  stream: Stream,
  ctx: StreamContext,
): StreamEvaluation {
  const judged = checksFor(stream, ctx);
  const checks = judged.map((j) => j.check);
  const outcome = checks.reduce<Outcome>(
    (worst, c) => (severity(c.outcome) > severity(worst) ? c.outcome : worst),
    "pass",
  );
  return {
    result: { streamId: stream.id, name: stream.name, outcome, checks },
    findings: judged.map((j) => j.finding),
  };
}
