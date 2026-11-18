import type { StateCode } from "../data/types";
import type { Profile } from "../migration";
import { STATE_CODES, STATE_NAMES } from "./context";
import type { Outlook, RuleCheck } from "./outlook";
import type { RelatedWork } from "./rules-types";

export type QuestionKind =
  | "state"
  | "months"
  | "years"
  | "visa-expiry"
  | "job-offer"
  | "study"
  | "regional";

/** One optional question, shared by every state (and visa) that needs it. */
export type Question = {
  field: keyof Profile;
  kind: QuestionKind;
  text: string;
  help?: string;
  affects: string[]; // state names, in code order
  affectsText: string; // "Affects: Western Australia, South Australia"
  max?: number; // upper bound for a number answer, matching state-answers.ts
};

type Template = {
  kind: QuestionKind;
  text: (state: StateCode | null, check: RuleCheck) => string;
  help?: string;
  max?: number;
};

const WORK_DEFINITIONS: Record<RelatedWork, string> = {
  "same-occupation": "same occupation",
  "anzsco-2-digit": "same first 2 ANZSCO digits",
  "anzsco-3-digit": "same first 3 ANZSCO digits",
};

const MONTHS_HELP =
  "Whole months, counted back from today. A break restarts the count.";

const YOUR_STATE = "the state you live in";

function stateName(state: StateCode | null): string {
  return state === null ? YOUR_STATE : STATE_NAMES[state];
}

// With no known state, no state's definition of related work is named.
function workText(state: StateCode | null, check: RuleCheck): string {
  if (state === null) return "your nominated occupation or a related one";
  const related = check.related ?? "same-occupation";
  if (related === "same-occupation") return "your nominated occupation";
  const name = STATE_NAMES[state];
  return `your nominated occupation or one ${name} treats as related (${WORK_DEFINITIONS[related]})`;
}

function yearsTemplate(window: 3 | 5 | 10): Template {
  return {
    kind: "years",
    text: () =>
      `Years of skilled work in your nominated occupation in the last ${window} years`,
    help: `Between 0 and ${window}. Decimals such as 1.5 are fine.`,
    max: window,
  };
}

// Listed in the order the questions are shown. incomeBand is deliberately absent.
const TEMPLATES: Partial<Record<keyof Profile, Template>> = {
  state: {
    kind: "state",
    text: () => "Which state or territory do you live in now?",
  },
  monthsLivingInState: {
    kind: "months",
    text: (state) =>
      `How many months in a row, up to now, have you lived in ${stateName(state)}?`,
    help: MONTHS_HELP,
    max: 600,
  },
  monthsLivingOffshore: {
    kind: "months",
    text: () =>
      "How many months in a row, up to now, have you lived outside Australia?",
    help: MONTHS_HELP,
    max: 600,
  },
  monthsWorkingInState: {
    kind: "months",
    text: (state, check) =>
      `How many months in a row, up to now, have you worked in ${stateName(state)}${state === null ? "," : ""} in ${workText(state, check)}?`,
    help: MONTHS_HELP,
    max: 600,
  },
  yearsExperienceLast3: yearsTemplate(3),
  yearsExperienceLast5: yearsTemplate(5),
  yearsExperienceLast10: yearsTemplate(10),
  visaExpiry: {
    kind: "visa-expiry",
    text: () => "When does your current visa expire?",
  },
  jobOfferState: {
    kind: "job-offer",
    text: () => "Which state or territory, if any, has a job offer for you?",
  },
  studyState: {
    kind: "study",
    text: () => "Which state or territory did you study in?",
  },
  livesRegional: {
    kind: "regional",
    text: () => "Do you live in a regional area?",
  },
};

const FIELD_ORDER = Object.keys(TEMPLATES) as (keyof Profile)[];

type Asked = Map<StateCode, RuleCheck>; // the check each affected state asks

function neededChecks(outlooks: Outlook[]): Map<keyof Profile, Asked> {
  const asked = new Map<keyof Profile, Asked>();
  for (const outlook of outlooks) {
    for (const outcome of outlook.states) {
      if (outcome.deciding?.outcome !== "needs-answer") continue;
      for (const check of outcome.deciding.checks) {
        const { field } = check;
        if (check.outcome !== "needs-answer" || field === undefined) continue;
        if (TEMPLATES[field] === undefined) continue;
        const entry = asked.get(field) ?? new Map();
        if (!entry.has(outcome.state)) entry.set(outcome.state, check);
        asked.set(field, entry);
      }
    }
  }
  return asked;
}

/**
 * The optional questions whose answers would change at least one state's
 * tile, de-duplicated by field across states and visas.
 */
export function questionsNeeded(
  outlooks: Outlook[],
  profile: Pick<Profile, "state">,
): Question[] {
  const asked = neededChecks(outlooks);
  const questions: Question[] = [];
  for (const field of FIELD_ORDER) {
    const entry = asked.get(field);
    const template = TEMPLATES[field];
    if (entry === undefined || template === undefined) continue;
    const affected = STATE_CODES.filter((s) => entry.has(s));
    const affects = affected.map((s) => STATE_NAMES[s]);
    // Word the question for the user's own state when it is affected.
    const own = affected.find((s) => s === profile.state) ?? null;
    const check = entry.get(own ?? affected[0]);
    if (check === undefined) continue;
    questions.push({
      field,
      kind: template.kind,
      text: template.text(own, check),
      ...(template.help === undefined ? {} : { help: template.help }),
      affects,
      affectsText: `Affects: ${affects.join(", ")}`,
      ...(template.max === undefined ? {} : { max: template.max }),
    });
  }
  return questions;
}
