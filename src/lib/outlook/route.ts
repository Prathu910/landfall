import type { StateCode, StateVisa } from "../data/types";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import type { Improve, Move } from "./improve";
import { LABEL_RANK, isAtLeast } from "./labels";
import type { OutlookLabel } from "./labels";
import { isLodged, joinAnd } from "./phrases";
import { statesHaveNoData } from "./combined";
import { noData, notEligible, nothingSuits } from "./route-combined";
import { buildDeadlines } from "./route-deadlines";
import type { RouteDeadline } from "./route-deadlines";
import {
  dated,
  improvementStep,
  invitation,
  lodgedStart,
  today,
  updateEoi,
} from "./route-steps";
import type { Dated, RouteStep } from "./route-steps";

export type { RouteStep } from "./route-steps";
export { daysBetween } from "./route-steps";
export type { RouteDeadline } from "./route-deadlines";
export type Route = { steps: RouteStep[]; deadlines: RouteDeadline[] };

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

function stateParts(o: ProfileOutlook): string[] {
  return stateVisas(o).map((v) => `${v.visa} ${STATE_NAMES[v.state]}`);
}

function submitEoiState(o: ProfileOutlook, with189: boolean): Dated {
  const parts = [...(with189 ? ["189"] : []), ...stateParts(o)];
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
  return [
    ...steps,
    improvementStep(move, true, o.v189.offList),
    updateEoi(move, true),
  ];
}

/**
 * A stamped state visa: check its rules, then submit for it. A lodged reader
 * starts from the EOI they submitted and adds the state to it instead.
 */
function stateRoute(input: OutlookInput, o: ProfileOutlook): Dated[] {
  const check = statesToCheck(o);
  const names = check.map((state) => STATE_NAMES[state]);
  const checkStep = dated("Check state rules", joinAnd(names), null);
  const lodged = isLodged(input);
  const eoi = lodged
    ? dated("Update your EOI", `add ${stateParts(o).join(" + ")}`, null)
    : submitEoiState(o, false);
  return [
    ...(lodged ? lodgedStart(input, o) : [today(input, o)]),
    ...(check.length > 0 ? [checkStep] : []),
    eoi,
    // An occupation off the 189 list can't be ticked for 189.
    ...(o.v189.offList
      ? []
      : [dated("Keep 189 ticked", "it costs nothing", null)]),
  ];
}

function lodged(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  const move = bestMove(improve);
  return [
    ...lodgedStart(input, o),
    ...(move ? [improvementStep(move, false)] : []),
    invitation(move ? move.to.label : o.v189.label),
  ];
}

function pickSteps(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Dated[] {
  if (o.stamp.kind === "combined") {
    if (o.v189.label === "not-eligible") return notEligible(input, o, improve);
    if (o.v189.label === "no-data") return noData(input, o);
    // Off the 189 list, no state data leaves only the lists to check.
    if (o.v189.offList && statesHaveNoData(o)) return noData(input, o);
    return nothingSuits(input, o);
  }
  const stateStamped = o.stamp.visa !== "189";
  if (isLodged(input)) {
    // The headline leads with the stamped state, so the route does too.
    return stateStamped ? stateRoute(input, o) : lodged(input, o, improve);
  }
  if (o.stamp.visa === "189" && o.stamp.label === "very-strong") {
    return veryStrong(input, o);
  }
  if (!stateStamped || isAtLeast(o.v189.label, "long-wait")) {
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
