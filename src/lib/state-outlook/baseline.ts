import type { Profile, UncheckedDate } from "../migration";
import { fail, joinWords, pass } from "./context";
import type { PointsEligibility, StreamContext, Verdict } from "./context";
import { toCheck } from "./judge";
import type { RuleCheck } from "./judge";

// The federal points test pass mark for 189, 190 and 491.
const PASS_MARK = 65;

// The user's own answers, so there is no rule page or check date.
function fromPointsCheck(label: string, verdict: Verdict): RuleCheck {
  return {
    ...toCheck(label, verdict, {
      source: "",
      checkedAt: "",
      stale: false,
      verification: "verified",
    }),
    basis: "points-check",
  };
}

const ELIGIBILITY =
  "Age, English test and skills assessment within the federal limits";

/** A missing points-check answer: what it is and the profile field it fills. */
type MissingAnswer = { topic: string; question: string; field?: keyof Profile };

// Ruling P32: these dates can be answered in "Sharpen my state outlook".
const DATE_ANSWERS: Record<UncheckedDate, MissingAnswer> = {
  englishDate: {
    topic: "your English test date",
    question: "Add your English test date",
    field: "englishDate",
  },
  assessmentDate: {
    topic: "your skills assessment issue date",
    question: "Add your skills assessment issue date",
    field: "assessmentDate",
  },
  assessmentExpiry: {
    topic: "your skills assessment expiry date",
    question: "Correct your skills assessment expiry date",
    field: "assessmentExpiry",
  },
};

// The labels `calculatePoints` puts in `missing`; only the main check asks them.
const MAIN_CHECK_ANSWERS: Record<string, Omit<MissingAnswer, "question">> = {
  "Date of birth": { topic: "your date of birth", field: "dob" },
  "English proficiency": { topic: "your English level", field: "english" },
  "Highest qualification": {
    topic: "your highest qualification",
    field: "qualification",
  },
  "Partner status": { topic: "your partner status", field: "partner" },
};

function mainCheckAnswer(label: string): MissingAnswer {
  const known = MAIN_CHECK_ANSWERS[label] ?? { topic: label.toLowerCase() };
  return { ...known, question: `Edit your answers to add ${known.topic}` };
}

function missingAnswers(eligibility: PointsEligibility): MissingAnswer[] {
  const answers = [
    ...eligibility.uncheckedDates.map((date) => DATE_ANSWERS[date]),
    ...eligibility.missing.map(mainCheckAnswer),
  ];
  return answers.length > 0
    ? answers
    : [{ topic: "your points check", question: "Complete your points check" }];
}

function askFor(answer: MissingAnswer): Verdict {
  const verdict: Verdict = {
    outcome: "needs-answer",
    finding: answer.topic,
    question: answer.question,
  };
  if (answer.field !== undefined) verdict.field = answer.field;
  return verdict;
}

// `eligible` covers only age, English and the skills assessment, never full
// visa eligibility. Unknown never passes: each missing answer is asked for.
function eligibilityChecks(ctx: StreamContext): RuleCheck[] {
  const { eligible, ineligibleReasons } = ctx.eligibility;
  if (eligible === false) {
    const reasons = joinWords(ineligibleReasons, "and");
    return [
      fromPointsCheck(ELIGIBILITY, fail(`Your points check shows ${reasons}`)),
    ];
  }
  if (eligible === null) {
    return missingAnswers(ctx.eligibility).map((answer) =>
      fromPointsCheck(ELIGIBILITY, askFor(answer)),
    );
  }
  return [fromPointsCheck(ELIGIBILITY, pass(ELIGIBILITY))];
}

function passMarkCheck(ctx: StreamContext): RuleCheck {
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
export function baselineChecks(ctx: StreamContext): RuleCheck[] {
  return [...eligibilityChecks(ctx), passMarkCheck(ctx)];
}
