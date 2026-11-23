import {
  listedStateVisas,
  notEligibleBest,
  statesHaveNoData,
} from "./combined";
import { isOffList } from "./label-189";
import { isAtLeast, labelName } from "./labels";
import type { HeadlineCtx, Stamped } from "./headline-context";
import { suitedStates } from "./headline-context";
import { capital, joinAnd, lowerFirst, moveName, theState } from "./phrases";

function best189(ctx: HeadlineCtx): string {
  const { o, improve, lodged } = ctx;
  const move = improve.moves.find((m) => m.best);
  if (lodged) {
    if (!move) return "Stay in the 189 queue.";
    const name = moveName(move.title);
    const to =
      move.to.label === "very-strong"
        ? "moves you to the front"
        : `lifts you to ${lowerFirst(labelName(move.to.label))}`;
    return `Stay in the 189 queue; ${name} ${to}.`;
  }
  const backup = suitedStates(o)[0];
  const strong = o.stamp.label === "very-strong";
  const lead = strong ? "189 Independent" : "189";
  if (!backup) return `${lead}.`;
  const pair = `${backup.state} ${backup.visa}`;
  return strong
    ? `${lead}, with ${pair} as a ${lowerFirst(labelName(backup.label))} backup.`
    : `${lead}, with ${pair} alongside.`;
}

function bestState(ctx: HeadlineCtx, stamped: Stamped): string {
  const { o, improve } = ctx;
  const suited = suitedStates(o);
  if (suited.length === 0) {
    return `${stamped.visa} in ${theState(stamped.state)}.`;
  }
  const same = suited.every((s) => s.state === suited[0].state);
  const visas = suited.map((s) => s.visa).join(" or ");
  const where = same
    ? `${visas} in ${theState(suited[0].state)}`
    : suited.map((s) => `${s.visa} in ${theState(s.state)}`).join(" or ");
  const move = improve.moves.find((m) => m.best);
  // Only a move that lifts 189 out of "not eligible" opens it later.
  const opens189 = move !== undefined && isAtLeast(move.to.label, "long-wait");
  if (o.v189.label === "not-eligible" && move && opens189) {
    const after = move.id.startsWith("english")
      ? "your English retake"
      : moveName(move.title);
    return `${where} now; 189 after ${after}.`;
  }
  const flagged = suited.find((s) => s.flag !== null);
  if (flagged?.flag === "rules-being-checked") {
    return `${where} (we're still checking ${theState(flagged.state)}'s rules).`;
  }
  if (flagged) return `${where} (answer the state questions to confirm).`;
  return `${where}.`;
}

/** "watch QLD and WA, which still list your occupation", or "" with no list. */
function watchStates(states: string[]): string {
  if (states.length === 0) return "";
  const list = states.length === 1 ? "lists" : "list";
  return `watch ${joinAnd(states)}, which still ${list} your occupation`;
}

/** Off the 189 list, only state nomination is left to name (23 Nov 2026). */
function bestOffList(ctx: HeadlineCtx): string {
  const { o, improve } = ctx;
  const visas = listedStateVisas(o);
  if (!visas) {
    return "None: the Home Affairs list doesn't include your occupation for 189, 190 or 491.";
  }
  const watch = watchStates(o.listMembership.states);
  const points =
    improve.plain.length > 0
      ? `More points could help ${visas}, with state nomination.`
      : `${visas} need${visas.includes(" and ") ? "" : "s"} state nomination.`;
  return `None right now. ${points}${watch ? ` ${capital(watch)}.` : ""}`;
}

function bestCombined(ctx: HeadlineCtx): string {
  const { o } = ctx;
  const { states, federal190, federal491 } = o.listMembership;
  // Points or a retake can open 189, so that leads, not "nothing suits".
  if (o.v189.label === "not-eligible") return notEligibleBest(o, ctx.improve);
  // Off the 189 list with no state data, list membership is all there is.
  const noData =
    o.stamp.label === "no-data" || (isOffList(o.v189) && statesHaveNoData(o));
  if (isOffList(o.v189) && !noData) return bestOffList(ctx);
  if (!noData) {
    if (states.length === 0) return "None right now. Stay in the pool.";
    // Named from list membership (ruling R16), not invitation evidence.
    const list = states.length === 1 ? "lists" : "list";
    return `None right now. Stay in the pool and watch ${joinAnd(states)}, which still ${list} your occupation.`;
  }
  const visas = [federal190 ? "190" : "", federal491 ? "491" : ""]
    .filter(Boolean)
    .join(" or ");
  // Ruling R7 covers invitation evidence; list membership is a separate fact.
  if (!visas || states.length === 0) {
    return "None we can judge yet. Submit your EOI and watch for published data.";
  }
  if (states.length === 1) {
    return `${visas} in ${theState(states[0])} (your occupation is on its list).`;
  }
  return `${visas} in a state that lists your occupation (${joinAnd(states)}).`;
}

export function bestLine(ctx: HeadlineCtx): string {
  if (ctx.o.stamp.kind === "combined") return bestCombined(ctx);
  return ctx.stamped ? bestState(ctx, ctx.stamped) : best189(ctx);
}
