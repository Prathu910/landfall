import type { Visa } from "../data/types";
import type { Profile } from "../migration";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { ENGLISH_MOVES, LEAD_TIME, candidates } from "./improve-candidates";
import type { Candidate, MoveId, SingleId } from "./improve-candidates";
import { CONFIRM, no189Data } from "./label-189";
import { LABEL_RANK, labelName } from "./labels";
import type { OutlookLabel } from "./labels";
import { buildLosses } from "./losses";
import type { Loss, Shift } from "./losses";

export type { Loss, Shift } from "./losses";

export type Move = {
  id: MoveId;
  title: string;
  detail: string;
  why: string;
  from: Shift;
  to: Shift;
  visa: Visa;
  best: boolean;
  date: string | null;
};
export type Improve = {
  mode: "improve" | "protect" | "points-not-problem" | "plain";
  banner: string | null;
  moves: Move[];
  losses: Loss[];
  plain: string[];
  /**
   * For a reader not yet eligible for 189: the change that takes them to 65
   * or restores an expired test or assessment, also in plain mode. Null when
   * none does, and always at 45 or over, which points can't fix.
   */
  opener: Move | null;
};

type Scored = Candidate & { outlook: ProfileOutlook };

// Moves report the 189 shift, also when 189 isn't inviting (spec 6.7).
const VISA: Visa = "189";
const BANNERS = {
  protect: "You're already at the top. The only risk is waiting too long.",
  closed189:
    "Points aren't what's holding you back. 189 needs to start listing your occupation again.",
  // Combined but not "not invited": a state visa may still respond to points.
  closed189Combined:
    "More points won't open 189: it needs to start listing your occupation again.",
  closedAll:
    "Points won't change this. No visa is inviting your occupation right now.",
};
const LODGED_NOTE =
  " Updating your EOI with new points resets your date of effect to that day.";

function shiftOf(outlook: ProfileOutlook): Shift {
  return { points: outlook.points.base, label: outlook.v189.label };
}

function whyOf(outlook: ProfileOutlook): string {
  const why = outlook.v189.why.endsWith(CONFIRM)
    ? outlook.v189.why.slice(0, -CONFIRM.length)
    : outlook.v189.why;
  if (outlook.v189.label !== "not-invited") return why;
  return `At ${outlook.points.base}, 189 is still ${labelName("not-invited")}. ${why}`;
}

function rankOf(label: OutlookLabel): number {
  return LABEL_RANK.indexOf(label);
}

function compareMoves(a: Move, b: Move): number {
  return (
    rankOf(a.to.label) - rankOf(b.to.label) ||
    b.to.points - a.to.points ||
    LEAD_TIME[a.id] - LEAD_TIME[b.id]
  );
}

function stacks(a: SingleId, b: SingleId): boolean {
  return !(ENGLISH_MOVES.includes(a) && ENGLISH_MOVES.includes(b));
}

function toMove(
  id: MoveId,
  name: string,
  detail: string,
  outlook: ProfileOutlook,
  base: ProfileOutlook,
): Move {
  const from = shiftOf(base);
  const to = shiftOf(outlook);
  const added = to.points - from.points;
  return {
    id,
    // A retake or renewal can restore eligibility without adding points.
    title: added > 0 ? `${name}, +${added}` : name,
    detail,
    why: whyOf(outlook),
    from,
    to,
    visa: VISA,
    best: false,
    date: null,
  };
}

/** The label gets better: the only kind of change worth "Biggest jump". */
function lifts(move: Move): boolean {
  return rankOf(move.to.label) < rankOf(move.from.label);
}

function scoreCandidates(input: OutlookInput, base: ProfileOutlook): Scored[] {
  const reasons = base.points.ineligibleReasons;
  return candidates(input.profile, input.asOf, reasons)
    .map((c) => ({
      ...c,
      outlook: evaluateProfile({ ...input, profile: c.apply(input.profile) }),
    }))
    .filter(
      (c) =>
        c.outlook.points.base > base.points.base ||
        rankOf(c.outlook.v189.label) < rankOf(base.v189.label),
    );
}

type Ranked = { candidate: Scored; move: Move };

/**
 * Every move, best first. A biggest jump is marked only in improve mode
 * (ruling R11) and only when it lifts the label, so it is never a change that
 * leaves the reader where they are (for example still not eligible).
 */
function buildMoves(
  input: OutlookInput,
  base: ProfileOutlook,
  scored: Scored[],
  markBest: boolean,
): Move[] {
  const note = input.profile.eoiDate ? LODGED_NOTE : "";
  const ranked: Ranked[] = scored
    .map((c) => ({
      candidate: c,
      move: toMove(c.id, c.name, c.detail + note, c.outlook, base),
    }))
    .sort((a, b) => compareMoves(a.move, b.move));
  const singles = ranked.map((r) => r.move);
  if (ranked.length === 0) return [];
  const first = ranked[0].candidate;
  const second = ranked
    .map((r) => r.candidate)
    .find((c) => c.id !== first.id && stacks(first.id, c.id));
  singles[0].best = markBest && lifts(singles[0]);
  if (!second) return singles;
  const profile: Profile = second.apply(first.apply(input.profile));
  const combined = toMove(
    "combined",
    "Both together",
    `${first.name} and ${second.phrase ?? second.name} together.${note}`,
    evaluateProfile({ ...input, profile }),
    base,
  );
  // Combined is the biggest jump only when it reaches a label no single move does.
  const beats = rankOf(combined.to.label) < rankOf(singles[0].to.label);
  if (markBest && lifts(combined) && beats) {
    singles[0].best = false;
    combined.best = true;
  }
  return [...singles, combined];
}

/**
 * The change that opens 189 to a reader who isn't eligible yet: the biggest
 * jump when there is one, else the first move that leaves "not eligible"
 * (in plain mode every label reads no data, so none is marked best).
 */
function openerOf(base: ProfileOutlook, moves: Move[]): Move | null {
  if (base.v189.label !== "not-eligible") return null;
  const best = moves.find((m) => m.best);
  // 189 is "not eligible" under 65 or without the basics, so any other label
  // means the change reaches 65 with the requirements met.
  return best ?? moves.find((m) => m.to.label !== "not-eligible") ?? null;
}

function plainLines(base: ProfileOutlook, scored: Scored[]): string[] {
  return scored.map((c) => {
    const after = c.outlook.points.base;
    const added = after - base.points.base;
    if (added === 0) return `${c.name}. Keeps you at ${after}.`;
    return `${c.name}, +${added}. Takes you to ${after}.`;
  });
}

function modeOf(input: OutlookInput, base: ProfileOutlook): Improve["mode"] {
  if (no189Data(input.core)) return "plain";
  if (base.v189.label === "very-strong") return "protect";
  if (base.v189.label === "not-invited") return "points-not-problem";
  return "improve";
}

function bannerOf(mode: Improve["mode"], base: ProfileOutlook): string | null {
  if (mode === "protect") return BANNERS.protect;
  if (mode !== "points-not-problem") return null;
  if (base.stamp.kind !== "combined") return BANNERS.closed189;
  return base.stamp.label === "not-invited"
    ? BANNERS.closedAll
    : BANNERS.closed189Combined;
}

export function buildImprove(
  input: OutlookInput,
  base: ProfileOutlook,
): Improve {
  const mode = modeOf(input, base);
  const shown = mode === "improve" || mode === "points-not-problem";
  // Each candidate is a full re-evaluation, so it runs once and only when
  // something reads it: shown moves, plain lines or the opener.
  const needOpener = base.v189.label === "not-eligible";
  const scored =
    shown || mode === "plain" || needOpener ? scoreCandidates(input, base) : [];
  const all =
    shown || needOpener
      ? buildMoves(input, base, scored, mode === "improve")
      : [];
  return {
    mode,
    banner: bannerOf(mode, base),
    moves: shown ? all : [],
    losses: buildLosses(input.profile, input.asOf, input.core, {
      points: base.points.base,
      eligible: base.points.eligible,
      label: base.v189.label,
    }),
    plain: mode === "plain" ? plainLines(base, scored) : [],
    opener: openerOf(base, all),
  };
}
