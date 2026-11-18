import { fail, joinWords, pass } from "./context";
import type { StreamContext, Verdict } from "./context";
import type { Judged } from "./judge";

// The federal points test pass mark for 189, 190 and 491.
const PASS_MARK = 65;

function fromPointsCheck(label: string, verdict: Verdict): Judged {
  const check: Judged["check"] = {
    label,
    outcome: verdict.outcome,
    source: "",
    checkedAt: "",
    stale: false,
    basis: "points-check",
  };
  if (verdict.question !== undefined) check.question = verdict.question;
  return { check, finding: verdict.finding };
}

// `eligible` covers only age, English and the skills assessment, never full
// visa eligibility; unknown never passes.
function eligibilityCheck(ctx: StreamContext): Judged {
  const label =
    "Age, English test and skills assessment within the federal limits";
  const { eligible, ineligibleReasons } = ctx.eligibility;
  if (eligible === false) {
    return fromPointsCheck(
      label,
      fail(`Your points check shows ${joinWords(ineligibleReasons, "and")}`),
    );
  }
  if (eligible === null) {
    // No profile field to ask for: the missing answers are in the main check.
    return fromPointsCheck(label, {
      outcome: "needs-answer",
      finding: "your points check",
      question: "Complete your points check",
    });
  }
  return fromPointsCheck(label, pass(label));
}

function passMarkCheck(ctx: StreamContext): Judged {
  const label = `At least ${PASS_MARK} points for ${ctx.visa} with nomination`;
  return fromPointsCheck(
    label,
    ctx.points >= PASS_MARK
      ? pass(`${ctx.points} points for ${ctx.visa} with nomination`)
      : fail(`Under the ${PASS_MARK}-point pass mark for ${ctx.visa}`),
  );
}

/**
 * Ruling P27: the federal minimums the points check already tests come before
 * any state rule, so no state reads as open to someone who misses them.
 */
export function baselineChecks(ctx: StreamContext): Judged[] {
  return [eligibilityCheck(ctx), passMarkCheck(ctx)];
}
