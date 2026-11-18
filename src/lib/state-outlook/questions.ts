import type { StateCode } from "../data/types";
import type { Profile } from "../migration";
import { joinWords, STATE_CODES, STATE_NAMES } from "./context";
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

type Asked = Map<StateCode, RuleCheck>; // the check each affected state asks

type Template = {
  kind: QuestionKind;
  // `state` is the user's own state when affected; `asked` holds every
  // affected state's check.
  text: (state: StateCode | null, check: RuleCheck, asked: Asked) => string;
  help?: (asked: Asked) => string;
  max?: number;
};

const WORK_DEFINITIONS: Record<RelatedWork, string> = {
  "same-occupation": "same occupation",
  "anzsco-2-digit": "same first 2 ANZSCO digits",
  "anzsco-3-digit": "same first 3 ANZSCO digits",
  "anzsco-4-digit": "same first 4 ANZSCO digits",
  "any-skilled": "any skilled occupation",
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

/** The one definition of related work every affected state shares, if any. */
function sharedDefinition(asked: Asked): RelatedWork | null {
  const definitions = new Set(
    [...asked.values()].map((c) => c.related ?? "same-occupation"),
  );
  return definitions.size === 1 ? [...definitions][0] : null;
}

function affectedNames(asked: Asked): string[] {
  return STATE_CODES.filter((s) => asked.has(s)).map((s) => STATE_NAMES[s]);
}

// Ruling P31: name the work the affected states count. When they count
// different work, ask about the nominated occupation alone, which every
// state counts, so a pass is true for each of them.
function yearsText(window: 3 | 5 | 10, asked: Asked): string {
  const related = sharedDefinition(asked) ?? "same-occupation";
  const lead = `Years of skilled work in the last ${window} years`;
  const names = affectedNames(asked);
  const counts = names.length === 1 ? "counts" : "count";
  const treats = names.length === 1 ? "treats" : "treat";
  if (related === "same-occupation") {
    return `Years of skilled work in your nominated occupation in the last ${window} years`;
  }
  if (related === "any-skilled") {
    return `${lead} in any skilled occupation (${joinWords(names, "and")} ${counts} any skilled work)`;
  }
  return `${lead} in your nominated occupation or one ${joinWords(names, "and")} ${treats} as related (${WORK_DEFINITIONS[related]})`;
}

function yearsTemplate(window: 3 | 5 | 10): Template {
  const range = `Between 0 and ${window}. Decimals such as 1.5 are fine.`;
  return {
    kind: "years",
    text: (_state, _check, asked) => yearsText(window, asked),
    help: (asked) =>
      sharedDefinition(asked) === null
        ? `${range} Count only your nominated occupation; some states also count related work.`
        : range,
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
    help: () => MONTHS_HELP,
    max: 600,
  },
  monthsLivingOffshore: {
    kind: "months",
    text: () =>
      "How many months in a row, up to now, have you lived outside Australia?",
    help: () => MONTHS_HELP,
    max: 600,
  },
  monthsWorkingInState: {
    kind: "months",
    text: (state, check) =>
      `How many months in a row, up to now, have you worked in ${stateName(state)}${state === null ? "," : ""} in ${workText(state, check)}?`,
    help: () => MONTHS_HELP,
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

function addCheck(
  asked: Map<keyof Profile, Asked>,
  state: StateCode,
  check: RuleCheck,
): void {
  const { field } = check;
  if (field === undefined || TEMPLATES[field] === undefined) return;
  const entry = asked.get(field) ?? new Map();
  if (!entry.has(state)) entry.set(state, check);
  asked.set(field, entry);
}

function neededChecks(outlooks: Outlook[]): Map<keyof Profile, Asked> {
  const asked = new Map<keyof Profile, Asked>();
  for (const outlook of outlooks) {
    for (const outcome of outlook.states) {
      // An open question only where answering it would change the tile.
      if (outcome.deciding?.outcome === "needs-answer") {
        for (const check of outcome.deciding.checks) {
          if (check.outcome === "needs-answer") {
            addCheck(asked, outcome.state, check);
          }
        }
      }
      // A given answer stays editable whichever stream used it, so it never
      // vanishes when it moves the deciding stream (or after a reload).
      for (const stream of outcome.streams) {
        for (const check of stream.checks) {
          if (check.outcome !== "needs-answer") {
            addCheck(asked, outcome.state, check);
          }
        }
      }
    }
  }
  return asked;
}

/**
 * The optional questions whose answers would change at least one state's
 * tile, plus those already answered, de-duplicated by field across states
 * and visas. Computed from the profile alone, so it survives a reload.
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
      text: template.text(own, check, entry),
      ...(template.help === undefined ? {} : { help: template.help(entry) }),
      affects,
      affectsText: `Affects: ${affects.join(", ")}`,
      ...(template.max === undefined ? {} : { max: template.max }),
    });
  }
  return questions;
}
