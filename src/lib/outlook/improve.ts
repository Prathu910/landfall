import type { Visa } from "../data/types";
import { buildTimeline, formatDate } from "../migration";
import type { Profile, TimelineEvent } from "../migration";
import { applyScenarios } from "../scenarios";
import { evaluateProfile } from "./evaluate-profile";
import type { OutlookInput, ProfileOutlook } from "./evaluate-profile";
import { CONFIRM, label189 } from "./label-189";
import { LABEL_RANK, labelName } from "./labels";
import type { OutlookLabel } from "./labels";

export type Shift = { points: number; label: OutlookLabel };
export type Move = {
  id:
    | "english-proficient"
    | "english-superior"
    | "naati"
    | "professional-year"
    | "partner-skills"
    | "experience"
    | "combined";
  title: string;
  detail: string;
  why: string;
  from: Shift;
  to: Shift;
  visa: Visa;
  best: boolean;
  date: string | null;
};
export type Loss = {
  date: string;
  title: string;
  detail: string;
  from: Shift;
  to: Shift;
  kind: "points" | "eligibility" | "eoi-expiry";
};
export type Improve = {
  mode: "improve" | "protect" | "points-not-problem" | "plain";
  banner: string | null;
  moves: Move[];
  losses: Loss[];
  plain: string[];
};

type SingleId = Exclude<Move["id"], "combined">;
type Candidate = {
  id: SingleId;
  name: string;
  /** The name as it reads mid-sentence. */
  phrase?: string;
  detail: string;
  apply: (profile: Profile) => Profile;
};
type Scored = Candidate & { outlook: ProfileOutlook };

// Moves report the 189 shift, also when 189 isn't inviting (spec 6.7).
const VISA: Visa = "189";
const LOSS_YEARS = 2;
// The profile holds years, not dates, so "shortest time" uses typical lead
// times: one test, then an English result, then longer steps.
const LEAD_TIME: Record<Move["id"], number> = {
  naati: 0,
  "english-proficient": 1,
  "english-superior": 2,
  "partner-skills": 3,
  "professional-year": 4,
  experience: 5,
  combined: 6,
};
const ENGLISH_MOVES: SingleId[] = ["english-proficient", "english-superior"];
const BANNERS = {
  protect: "You're already at the top. The only risk is waiting too long.",
  closed189:
    "Points aren't what's holding you back. 189 needs to start listing your occupation again.",
  closedAll:
    "Points won't change this. No visa is inviting your occupation right now.",
};
const LODGED_NOTE =
  " Updating your EOI with new points resets your date of effect to that day.";

/** The next experience band; applyScenarios leaves 8+ years unchanged. */
function experienceCandidate(profile: Profile, asOf: string): Candidate {
  // Onshore readers are building Australian experience; others overseas.
  const band = profile.onshore ? "australian-work" : "overseas-work";
  const next = applyScenarios(profile, [band], asOf);
  const years = profile.onshore ? next.australianYears : next.overseasYears;
  const where = profile.onshore ? "Australian" : "overseas";
  const unit = years === 1 ? "year" : "years";
  const possessive = years === 1 ? "year's" : "years'";
  return {
    id: "experience",
    name: `${years} ${possessive} ${where} experience`,
    detail: `Happens on its own when you reach ${years} ${unit}.`,
    apply: (p) => applyScenarios(p, [band], asOf),
  };
}

/** Every move to try; scoreCandidates keeps those that add points. */
function candidates(profile: Profile, asOf: string): Candidate[] {
  const scenario = (id: string) => (p: Profile) =>
    applyScenarios(p, [id], asOf);
  const list: Candidate[] = [
    {
      id: "english-proficient",
      name: "Proficient English",
      detail: "A new English test result at Proficient level.",
      apply: (p) => ({ ...p, english: "proficient", englishDate: asOf }),
    },
    {
      id: "english-superior",
      name: "Superior English",
      detail: "A new English test result at Superior level.",
      apply: scenario("english"),
    },
    {
      id: "naati",
      name: "NAATI CCL test",
      detail: "One test in a community language.",
      apply: scenario("language"),
    },
    // calculatePoints decides which occupations a Professional Year counts for.
    {
      id: "professional-year",
      name: "Professional Year",
      detail: "A Professional Year program in your field, about 12 months.",
      apply: (p) => ({
        ...p,
        professionalYear: true,
        professionalYearDate: "",
      }),
    },
  ];
  if (profile.partner === "english") {
    list.push({
      id: "partner-skills",
      name: "Partner skills assessment",
      phrase: "your partner's skills assessment",
      detail: "Partner points go from 5 to 10.",
      apply: (p) => ({ ...p, partner: "skilled" }),
    });
  }
  return [...list, experienceCandidate(profile, asOf)];
}

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
  id: Move["id"],
  name: string,
  detail: string,
  outlook: ProfileOutlook,
  base: ProfileOutlook,
): Move {
  const from = shiftOf(base);
  const to = shiftOf(outlook);
  return {
    id,
    title: `${name}, +${to.points - from.points}`,
    detail,
    why: whyOf(outlook),
    from,
    to,
    visa: VISA,
    best: false,
    date: null,
  };
}

function scoreCandidates(input: OutlookInput, base: ProfileOutlook): Scored[] {
  return candidates(input.profile, input.asOf)
    .map((c) => ({
      ...c,
      outlook: evaluateProfile({ ...input, profile: c.apply(input.profile) }),
    }))
    .filter((c) => c.outlook.points.base > base.points.base);
}

function buildMoves(input: OutlookInput, base: ProfileOutlook): Move[] {
  const note = input.profile.eoiDate ? LODGED_NOTE : "";
  const scored = scoreCandidates(input, base);
  const singles = scored
    .map((c) => toMove(c.id, c.name, c.detail + note, c.outlook, base))
    .sort(compareMoves);
  if (singles.length === 0) return [];
  const byId = (id: Move["id"]) => scored.find((c) => c.id === id) as Scored;
  const first = byId(singles[0].id);
  const second = singles
    .map((m) => byId(m.id))
    .find((c) => c.id !== first.id && stacks(first.id, c.id));
  singles[0].best = true;
  if (!second) return singles;
  const profile = second.apply(first.apply(input.profile));
  const combined = toMove(
    "combined",
    "Both together",
    `${first.name} and ${second.phrase ?? second.name} together.${note}`,
    evaluateProfile({ ...input, profile }),
    base,
  );
  // Combined is the biggest jump only when it reaches a label no single move does.
  if (rankOf(combined.to.label) < rankOf(singles[0].to.label)) {
    singles[0].best = false;
    combined.best = true;
  }
  return [...singles, combined];
}

// The timeline has no event ids, so its fixed titles identify these events.
const BASIC =
  "is a basic requirement, not a points loss. Without one you can't be invited for any of the three visas until you";
const NAMED_LOSSES: Record<string, Omit<Loss, "date" | "from" | "to">> = {
  "EOI validity ends": {
    kind: "eoi-expiry",
    title: "EOI expires",
    detail:
      "If you aren't invited by then, you'd have to submit a new EOI, with a new date of effect.",
  },
  "English test validity ends": {
    kind: "eligibility",
    title: "English test expires",
    detail: `A valid English test ${BASIC} retake it.`,
  },
  "Skills assessment validity ends": {
    kind: "eligibility",
    title: "Skills assessment expires",
    detail: `A valid skills assessment ${BASIC} renew it.`,
  },
  "Your 45th birthday": {
    kind: "eligibility",
    title: "Your 45th birthday",
    detail: "You have to be under 45 when you're invited.",
  },
};

/** Null for gains and dates that change no points (a visa expiry). */
function describeLoss(
  event: TimelineEvent,
): Omit<Loss, "date" | "from" | "to"> | null {
  const on = formatDate(event.date);
  const named = NAMED_LOSSES[event.title];
  if (named) return { ...named, title: `${named.title}, ${on}` };
  const delta = event.delta ?? 0;
  if (delta >= 0) return null;
  return {
    kind: "points",
    title: `${event.title}, ${on}: −${-delta}`,
    detail: event.description,
  };
}

/** Timeline losses within 2 years, each starting where the last one left off. */
function buildLosses(input: OutlookInput, base: ProfileOutlook): Loss[] {
  const { asOf, core } = input;
  const limit = `${Number(asOf.slice(0, 4)) + LOSS_YEARS}${asOf.slice(4)}`;
  let points = base.points.base;
  let eligible = base.points.eligible;
  let label = base.v189.label;
  const losses: Loss[] = [];
  for (const event of buildTimeline(input.profile, asOf)) {
    const loss = describeLoss(event);
    if (loss === null || event.date > limit) continue;
    const from = { points, label };
    points += event.delta ?? 0;
    if (loss.kind === "eligibility") eligible = false;
    label = label189({ points, eligible, core }).label;
    losses.push({ date: event.date, ...loss, from, to: { points, label } });
  }
  return losses;
}

function plainLines(input: OutlookInput, base: ProfileOutlook): string[] {
  return scoreCandidates(input, base).map((c) => {
    const after = c.outlook.points.base;
    return `${c.name}, +${after - base.points.base}. Takes you to ${after}.`;
  });
}

function modeOf(base: ProfileOutlook): Improve["mode"] {
  if (base.stamp.kind === "combined" && base.stamp.label === "no-data") {
    return "plain";
  }
  if (base.v189.label === "very-strong") return "protect";
  if (base.v189.label === "not-invited") return "points-not-problem";
  return "improve";
}

function bannerOf(mode: Improve["mode"], base: ProfileOutlook): string | null {
  if (mode === "protect") return BANNERS.protect;
  if (mode !== "points-not-problem") return null;
  return base.stamp.kind === "combined" ? BANNERS.closedAll : BANNERS.closed189;
}

export function buildImprove(
  input: OutlookInput,
  base: ProfileOutlook,
): Improve {
  const mode = modeOf(base);
  const plain = mode === "plain" ? plainLines(input, base) : [];
  const moves =
    mode === "improve" || mode === "points-not-problem"
      ? buildMoves(input, base)
      : [];
  return {
    mode,
    banner: bannerOf(mode, base),
    moves,
    losses: buildLosses(input, base),
    plain,
  };
}
