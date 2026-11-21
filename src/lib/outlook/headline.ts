import type { StateVisa } from "../data/types";
import { countInSentence, formatCount, submissionMonth } from "../report/copy";
import { STATE_NAMES } from "../state-outlook/context";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { lastListedMonth } from "./facts";
import { bestLine } from "./headline-best";
import { capital, stampedState } from "./headline-context";
import type { HeadlineCtx, Stamped } from "./headline-context";
import type { Improve } from "./improve";
import { CONFIRM, MIN_POINTS } from "./label-189";
import { isAtLeast, labelName } from "./labels";
import {
  longMonth,
  lowerFirst,
  namedState,
  occupationName,
  stateVisaOf,
  stateWhy,
  theState,
  withoutConfirm,
} from "./phrases";
import { estimatedWait, roughly, submittedBefore } from "./wait";

export type Headline = {
  who: string;
  h1: string;
  fact: string;
  best: string;
  why: string;
};

function whoLine(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `${trimmed}'s report.` : "Your report.";
}

function h1(ctx: HeadlineCtx): string {
  const { o, name, lodged, stamped } = ctx;
  const { stamp, v189 } = o;
  if (stamp.kind === "combined") {
    if (stamp.label === "no-data") {
      return "There isn't enough published data to judge your occupation.";
    }
    if (stamp.label === "not-invited") {
      return `None of the three visas is inviting ${name} right now.`;
    }
    if (stamp.label === "long-wait") {
      return "Every visa is a long wait at your points right now.";
    }
    return "None of the three visas is open to you yet.";
  }
  if (!stamped) {
    if (stamp.label === "very-strong")
      return "You're at the front of the queue.";
    if (lodged && stamp.label === "competitive") {
      return "You're in the queue, right at the cut-off.";
    }
    if (lodged) return "You're in the queue, at or above recent cut-offs.";
    if (stamp.label === "strong") return "You're in a strong position for 189.";
    return "You're on the edge for 189.";
  }
  const where = theState(stamped.state);
  if (v189.label === "not-invited") {
    return "Your way in is state nomination, not 189.";
  }
  if (v189.label === "not-eligible") {
    return `${stamped.visa} in ${where} is open to you now. 189 isn't, yet.`;
  }
  if (isAtLeast(v189.label, "competitive")) {
    return `Your best chance is ${where}, with 189 close behind.`;
  }
  return `Your best chance is ${where}, not 189.`;
}

function roundsFact(ctx: HeadlineCtx): string {
  const { input, o, name } = ctx;
  const points = o.points.base;
  const recent = input.core?.rounds189.slice(0, 6) ?? [];
  const enough = recent.filter(
    (r) => r.cutoff !== null && r.cutoff <= points,
  ).length;
  const lead = `${points} points was enough in ${enough} of the last ${recent.length} rounds`;
  const tied = o.v189.tied;
  if (!tied || tied.max === 0) return `${lead}.`;
  return `${lead}, but ${countInSentence(tied)} ${name} EOIs are tied with you at ${points}.`;
}

function frontFact(ctx: HeadlineCtx): string {
  const { o, name } = ctx;
  const { ahead, lastThree } = o.v189;
  const points = o.points.base;
  const who = (ahead?.max ?? 0) === 0 ? "No" : "Fewer than 20";
  const top = Math.max(...lastThree);
  const rounds =
    lastThree.length === 1
      ? `your occupation's last listed round had a cut-off of ${top} or less`
      : `your occupation's last ${lastThree.length} listed rounds all had cut-offs of ${top} or less`;
  return `${who} ${name} EOIs score higher than your ${points}, and ${rounds}.`;
}

/** Spec 6.5 pace inputs, read back as a sentence; null without a pace. */
function lodgedFact(ctx: HeadlineCtx): string | null {
  const { input, o, name } = ctx;
  const { core, detail, profile } = input;
  const pace = estimatedWait(o, input).pace;
  const month = submissionMonth(profile.eoiDate);
  if (!pace || !core || !detail || !month || !o.v189.ahead) return null;
  const points = o.points.base;
  const round = core.rounds189.find(
    (r) => r.cutoff !== null && r.cutoff <= points,
  );
  const before = submittedBefore(detail, points, month);
  const ahead =
    `Roughly ${roughly(pace.ahead)} EOIs are ahead of you: ` +
    `${formatCount(o.v189.ahead)} with higher scores, and about ${roughly(before)} ` +
    `at ${points} submitted before ${longMonth(month)}.`;
  if (!round) return ahead;
  const when = longMonth(round.date.slice(0, 7));
  return `The ${when} round invited ${name} down to ${round.cutoff} points, earliest dates first. ${ahead}`;
}

/** Where 189 stands when a state route is stamped (spec 6.4). */
function position189(ctx: HeadlineCtx): string {
  const { input, o, name } = ctx;
  const { v189, points } = o;
  if (v189.label === "not-invited") {
    const last = lastListedMonth(input);
    const since = last ? `, since ${last}` : "";
    return `189 hasn't listed ${name} in any of the last 4 rounds${since}.`;
  }
  if (v189.label === "not-eligible") {
    if (points.base >= MIN_POINTS) return withoutConfirm(v189.why);
    const add190 = points.subclass190 - points.base;
    const add491 = points.subclass491 - points.base;
    return (
      `189 needs at least ${MIN_POINTS} points and you have ${points.base}. ` +
      `State nomination adds ${add190} (190) or ${add491} (491), which takes you to ${points.subclass190} and ${points.subclass491}.`
    );
  }
  if (v189.label === "long-wait" && v189.lastThree.length > 0) {
    const low = Math.min(...v189.lastThree);
    const high = Math.max(...v189.lastThree);
    const range = low === high ? `${low}` : `${low} to ${high}`;
    const ahead = v189.ahead
      ? `, with ${countInSentence(v189.ahead)} EOIs ahead of you`
      : "";
    return `At ${points.base} you're behind every recent 189 cut-off (${range})${ahead}.`;
  }
  return `For 189, ${lowerFirst(withoutConfirm(v189.why))}`;
}

function stateFact(ctx: HeadlineCtx, stamped: Stamped): string {
  const { o, name } = ctx;
  const position = position189(ctx);
  const state = namedState(stateVisaOf(o, stamped.visa));
  if (o.v189.label === "not-eligible" || !state) return position;
  const where = capital(theState(state.state));
  return `${position} ${where} has invited ${name} EOIs at or below your ${stamped.points} points with nomination in ${state.monthsAtOrBelow6} of the last 6 months.`;
}

function combinedFact(ctx: HeadlineCtx): string {
  const { input, o, name } = ctx;
  const { stamp, v189, v190, v491 } = o;
  if (stamp.label === "no-data") {
    return stamp.tooFew
      ? `Every published 189 count for ${name} is under 20, too few to compare you with.`
      : `SkillSelect hasn't published any EOI counts, 189 rounds or state invitations for ${name}, so there's nothing to compare you with.`;
  }
  const last = lastListedMonth(input);
  const lead =
    v189.label === "not-invited"
      ? `189 hasn't listed ${name} ${last ? `since ${last}` : "in any of the last 4 rounds"}`
      : `For 189, ${lowerFirst(withoutConfirm(v189.why)).replace(/\.$/, "")}`;
  const noneInvited =
    v190?.label === "not-invited" && v491?.label === "not-invited";
  const states = noneInvited
    ? "no state has invited it for 190 or 491 in the last 6 months"
    : "neither 190 nor 491 is Competitive or better for you";
  return `${lead}, and ${states}.`;
}

function fact(ctx: HeadlineCtx): string {
  const { stamp } = ctx.o;
  if (stamp.kind === "combined") return combinedFact(ctx);
  if (ctx.stamped) return stateFact(ctx, ctx.stamped);
  if (stamp.label === "very-strong") return frontFact(ctx);
  return (ctx.lodged ? lodgedFact(ctx) : null) ?? roundsFact(ctx);
}

function visaWhy(ctx: HeadlineCtx, visa: StateVisa): string {
  const label = stateVisaOf(ctx.o, visa);
  if (!label) return "no published state invitations";
  return label.best
    ? stateWhy(label.best)
    : "no state's rules fit your answers";
}

function why(ctx: HeadlineCtx): string {
  const { o, stamped } = ctx;
  const { stamp, v189 } = o;
  if (stamp.kind === "single" && !stamped) {
    return `${labelName(stamp.label)}: ${v189.why}`;
  }
  const why189 = lowerFirst(v189.why);
  if (stamped) {
    const state = STATE_NAMES[stamped.state];
    const evidence = visaWhy(ctx, stamped.visa);
    return (
      `Stamp shows your best visa. ${stamped.visa} ${state} is ${labelName(stamp.label)}: ${evidence}. ` +
      `189 is ${labelName(v189.label, v189.tooFew)}: ${why189}`
    );
  }
  const lead = "so the stamp covers all three.";
  if (stamp.label === "no-data") {
    const detail = stamp.tooFew
      ? "every published count for this occupation is under 20"
      : "no published EOIs, rounds or state invitations for this occupation";
    return `No visa has enough data for a label, ${lead} ${labelName("no-data", stamp.tooFew)}: ${detail}.`;
  }
  const w190 = visaWhy(ctx, "190");
  const w491 = visaWhy(ctx, "491");
  const states =
    w190 === w491 ? `190 and 491: ${w190}.` : `190: ${w190}. 491: ${w491}.`;
  // The confirm note reads last, after every visa's reason.
  const confirm = v189.why.endsWith(CONFIRM) ? CONFIRM : "";
  const reason189 = lowerFirst(withoutConfirm(v189.why));
  return `No visa is Competitive or better, ${lead} 189: ${reason189} ${states}${confirm}`;
}

export function buildHeadline(
  input: OutlookInput,
  o: ProfileOutlook,
  improve: Improve,
): Headline {
  const ctx: HeadlineCtx = {
    input,
    o,
    improve,
    name: occupationName(input),
    lodged: input.profile.eoiDate !== "",
    stamped: stampedState(o),
  };
  return {
    who: whoLine(input.profile.name),
    h1: h1(ctx),
    fact: fact(ctx),
    best: bestLine(ctx),
    why: why(ctx),
  };
}
