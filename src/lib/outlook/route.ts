import type { StateCode, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { Improve, Move } from "./improve";
import { LABEL_RANK, isAtLeast } from "./labels";
import type { OutlookLabel } from "./labels";
import { buildDeadlines } from "./route-deadlines";
import type { RouteDeadline } from "./route-deadlines";

export type RouteStep = {
  title: string;
  sub: string;
  points: number | null;
  label: OutlookLabel | null;
};
export type { RouteDeadline } from "./route-deadlines";
export type Route = { steps: RouteStep[]; deadlines: RouteDeadline[] };

/** A step with the date it happens; null means now. */
type Dated = { step: RouteStep; date: string | null };

const MS_PER_DAY = 86_400_000;

function dated(
  title: string,
  sub: string,
  date: string | null,
  points: number | null = null,
  label: OutlookLabel | null = null,
): Dated {
  return { step: { title, sub, points, label }, date };
}

function joinList(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

function today(input: OutlookInput, o: ProfileOutlook): Dated {
  return dated(
    "Today",
    formatDate(input.asOf),
    input.asOf,
    o.points.base,
    o.v189.label,
  );
}

/** Each state visa with its own best state; none for a visa that names no state (ruling R7). */
function stateVisas(
  o: ProfileOutlook,
): { visa: StateVisa; state: StateCode }[] {
  const options = [
    { visa: "190" as const, best: o.v190?.best ?? null },
    { visa: "491" as const, best: o.v491?.best ?? null },
  ];
  return options.flatMap(({ visa, best }) =>
    best && isAtLeast(best.label, "not-eligible")
      ? [{ visa, state: best.state }]
      : [],
  );
}

/** The strongest state to pair with 189; 190 wins a tie, and only competitive or better counts. */
function strongestState(
  o: ProfileOutlook,
): { state: StateCode; visa: StateVisa } | null {
  const options = [
    { visa: "190" as const, best: o.v190?.best ?? null },
    { visa: "491" as const, best: o.v491?.best ?? null },
  ];
  let pick: { state: StateCode; visa: StateVisa; label: OutlookLabel } | null =
    null;
  for (const { visa, best } of options) {
    if (!best || !isAtLeast(best.label, "competitive")) continue;
    if (
      pick === null ||
      LABEL_RANK.indexOf(best.label) < LABEL_RANK.indexOf(pick.label)
    ) {
      pick = { state: best.state, visa, label: best.label };
    }
  }
  return pick;
}

function submitEoi189(o: ProfileOutlook): Dated {
  const pick = strongestState(o);
  const sub = pick ? `189 + ${pick.state} ${pick.visa}, now` : "189, now";
  return dated("Submit EOI", sub, null);
}

function submitEoiState(o: ProfileOutlook, with189: boolean): Dated {
  const parts = [
    ...(with189 ? ["189"] : []),
    ...stateVisas(o).map((v) => `${v.visa} ${STATE_NAMES[v.state]}`),
  ];
  return dated("Submit EOI", parts.join(" + "), null);
}

/** States whose rules are still being checked and that suit the reader. */
function statesToCheck(o: ProfileOutlook): StateCode[] {
  const found: StateCode[] = [];
  for (const visa of [o.v190, o.v491]) {
    for (const s of visa?.states ?? []) {
      const suits = isAtLeast(s.label, "competitive");
      if (
        suits &&
        s.flag === "rules-being-checked" &&
        !found.includes(s.state)
      ) {
        found.push(s.state);
      }
    }
  }
  return found;
}

function improvementName(move: Move): string {
  return move.title.replace(/, \+\d+$/, "");
}

function improvementStep(move: Move, retake: boolean): Dated {
  const isEnglish = move.id.startsWith("english");
  const name = improvementName(move);
  const title = retake && isEnglish ? "English retake" : name;
  const sub = retake && isEnglish ? name : move.detail;
  return dated(title, sub, move.date, move.to.points, move.to.label);
}

function updateEoi(move: Move | undefined, opensNote: boolean): Dated {
  const opens = move && opensNote && isAtLeast(move.to.label, "long-wait");
  const sub = opens ? "189 can open to you" : "the day results arrive";
  return dated("Update your EOI", sub, null);
}

function invitation(label: OutlookLabel | null): Dated {
  return dated("Invitation", "60 days to lodge", null, null, label);
}

function bestMove(improve: Improve): Move | undefined {
  return improve.moves.find((m) => m.best);
}

function veryStrong(input: OutlookInput, o: ProfileOutlook): Dated[] {
  return [
    today(input, o),
    submitEoi189(o),
    dated("Gather documents", "police checks, medicals", null),
    invitation(o.v189.label),
  ];
}

function improving(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  const move = bestMove(improve);
  const submit =
    o.stamp.kind === "single" && o.stamp.visa !== "189"
      ? submitEoiState(o, true)
      : submitEoi189(o);
  if (!move) return [today(input, o), submit, invitation(o.v189.label)];
  return [
    today(input, o),
    submit,
    improvementStep(move, false),
    updateEoi(move, false),
  ];
}

function belowThreshold(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  const move = bestMove(improve);
  const steps = [today(input, o), submitEoiState(o, false)];
  if (!move) return steps;
  return [...steps, improvementStep(move, true), updateEoi(move, true)];
}

function stateRoute(input: OutlookInput, o: ProfileOutlook): Dated[] {
  const check = statesToCheck(o);
  const names = check.map((state) => STATE_NAMES[state]);
  const checkStep = dated("Check state rules", joinList(names), null);
  return [
    today(input, o),
    ...(check.length > 0 ? [checkStep] : []),
    submitEoiState(o, false),
    dated("Keep 189 ticked", "it costs nothing", null),
  ];
}

function lodged(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  const { eoiDate } = input.profile;
  const move = bestMove(improve);
  const waiting = dated(
    "Today",
    `${daysBetween(eoiDate, input.asOf)} days waiting`,
    input.asOf,
  );
  return [
    dated(
      "EOI submitted",
      formatDate(eoiDate),
      eoiDate,
      o.points.base,
      o.v189.label,
    ),
    waiting,
    ...(move ? [improvementStep(move, false)] : []),
    invitation(move ? move.to.label : o.v189.label),
  ];
}

function nothingSuits(input: OutlookInput, o: ProfileOutlook): Dated[] {
  const { states } = o.listMembership;
  const watch =
    states.length > 0
      ? [dated(`Watch ${joinList(states)}`, "they still list you", null)]
      : [];
  return [
    today(input, o),
    dated("Keep your EOI in", "189 + 190 + 491", null),
    dated("Check other occupations", "you could be assessed in", null),
    ...watch,
  ];
}

function noData(input: OutlookInput, o: ProfileOutlook): Dated[] {
  const { states } = o.listMembership;
  const title =
    states.length === 1
      ? `Check ${states[0]}'s program`
      : "Check state programs";
  return [
    today(input, o),
    dated(title, "190 and 491", null),
    dated("Submit EOI", "189 + 190 + 491", null),
    dated("Wait for a state", "or a 189 round", null),
  ];
}

function pickSteps(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  if (o.v189.label === "no-data" && o.stamp.kind === "combined") {
    return noData(input, o);
  }
  if (o.stamp.kind === "combined") return nothingSuits(input, o);
  if (input.profile.eoiDate) return lodged(input, o, improve);
  if (o.stamp.visa === "189" && o.stamp.label === "very-strong") {
    return veryStrong(input, o);
  }
  if (o.stamp.visa === "189" || isAtLeast(o.v189.label, "long-wait")) {
    return improving(input, o, improve);
  }
  if (o.v189.label === "not-eligible") return belowThreshold(input, o, improve);
  return stateRoute(input, o);
}

export function buildRoute(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Route {
  const steps = pickSteps(input, o, improve);
  const deadlines = buildDeadlines(improve.losses, steps, input.asOf);
  return { steps: steps.map((s) => s.step), deadlines };
}
