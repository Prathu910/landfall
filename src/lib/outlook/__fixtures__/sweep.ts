import index from "../../../data/occupation-index.json";
import {
  loadOccupationCore,
  loadOccupationDetail,
} from "../../data/load-server";
import type { OccupationCore, OccupationDetail } from "../../data/types";
import type { Profile } from "../../migration";
import { LABEL_RANK } from "../labels";
import type { OutlookLabel } from "../labels";
import { checkRead } from "../read-contract";
import { buildOutlookView } from "../view";
import type { OccupationState, ReportOutlookView } from "../view";
import { PLANNER, profileInput } from "./review-profiles";

/**
 * Every occupation in the snapshot, at a few point levels, for a planner and
 * a lodged reader (final review, ruling R32). Deterministic: real data, a
 * fixed asOf and fixed profiles.
 */

// Points before changes, with the answers that give them (asserted in the tests).
export const LEVELS: Record<number, Partial<Profile>> = {
  60: { english: "competent", overseasYears: 3 },
  70: { english: "proficient", overseasYears: 3 },
  80: { english: "superior", overseasYears: 3 },
  90: { english: "superior", overseasYears: 8 },
};
const LODGED_ON = "2026-02-10";

// A masked or summed count written as a number ("0–38", "0 to 40",
// "about 0"), or a value that leaked through as text.
const BAD_TEXT = /\b0–|\b0 to \d|\babout 0\b|NaN|undefined|Infinity/;
const NO_VISA_INVITING = /No visa is inviting/;
const OPENS_189 = /opens 189/;
// After a change, 189 still has nothing to open (ruling R34).
const STILL_CLOSED = ["not-invited", "no-data"];
// Off the Home Affairs 189 list, nothing may suggest 189 is a data question,
// that an EOI for it can be submitted, or that anything opens it.
const OFF_LIST_BANNED = [
  /not enough .*189 data|enough published 189 data/i,
  /submit an EOI/i,
  /opens 189|189 can open/i,
  /\b189 \+|\+ 189\b|Keep 189 ticked/,
];

// Off the 189 list, a claim that points help the state visas (headline-best,
// improve banner) needs a state visa that invites or has too little data.
const POINTS_HELP_STATES = /could help (190|491)|still count for (190|491)/;

type Loaded = { code: string; state: OccupationState };

// Loaded once: the rules and asOf are the same for every view.
const { asOf, rules } = profileInput(PLANNER);

/** How many occupations the live index lists. */
export const OCCUPATION_COUNT = index.length;

export const OCCUPATIONS: Loaded[] = index.map((entry) => {
  const core: OccupationCore | null = entry.hasData
    ? loadOccupationCore(entry.code)
    : null;
  const detail: OccupationDetail | null = core
    ? loadOccupationDetail(entry.code)
    : null;
  // The client never fetches hasData: false occupations (docs/DATA.md).
  const state: OccupationState = core
    ? { status: "ready", core, detail }
    : { status: "unavailable" };
  return { code: entry.code, state };
});

/** Every string anywhere in the view. */
function stringsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(stringsOf);
  }
  return [];
}

function viewOf(profile: Profile, occupation: OccupationState) {
  const view = buildOutlookView({ profile, asOf, rules, occupation });
  if (view.kind !== "report")
    throw new Error(`${profile.occupation}: ${view.kind}`);
  return view;
}

const rank = (label: OutlookLabel) => LABEL_RANK.indexOf(label);

function liftsAny(view: ReportOutlookView): boolean {
  return view.improve.moves.some((m) => rank(m.to.label) < rank(m.from.label));
}

/** The founder's 23 Nov 2026 decision: the report says 189 isn't available. */
function offListProblems(code: string, view: ReportOutlookView): string[] {
  if (rules.federal?.entries[code]?.["189"] === true) return [];
  const problems = stringsOf(view).flatMap((text) =>
    OFF_LIST_BANNED.some((banned) => banned.test(text))
      ? [`${code}: off the 189 list but says "${text}"`]
      : [],
  );
  const responds = view.visas
    .slice(1)
    .some(
      (card) =>
        card.label === "no-data" || rank(card.label) <= rank("long-wait"),
    );
  if (!responds) {
    const claims = [view.headline.best ?? "", view.improve.banner ?? ""];
    for (const text of claims.filter((t) => POINTS_HELP_STATES.test(t))) {
      problems.push(`${code}: no state visa is inviting but says "${text}"`);
    }
  }
  const card = view.visas[0];
  if (
    card.stampWord !== "Not available" ||
    view.facts.visas[0].label !== "Not available"
  ) {
    problems.push(
      `${code}: off the 189 list but its 189 stamp says ${card.stampWord}`,
    );
  }
  return problems;
}

/** Each problem as "code: what", so a failure lists every case at once. */
function problemsOf(code: string, view: ReportOutlookView): string[] {
  const problems: string[] = offListProblems(code, view);
  const read = checkRead(view.templateRead, view.facts);
  if (!read.ok) problems.push(`${code}: template read fails (${read.reason})`);
  for (const text of stringsOf(view)) {
    if (BAD_TEXT.test(text)) problems.push(`${code}: "${text}"`);
  }
  for (const move of view.improve.moves.filter((m) => m.best)) {
    if (move.to.label === move.from.label) {
      problems.push(`${code}: best move ${move.id} keeps ${move.to.label}`);
    }
  }
  const opener = view.improve.opener;
  const closed = opener !== null && STILL_CLOSED.includes(opener.to.label);
  if (closed && stringsOf(view).some((t) => OPENS_189.test(t))) {
    problems.push(`${code}: says ${opener.id} opens 189 (${opener.to.label})`);
  }
  if (/biggest jump/i.test(view.templateRead) && !liftsAny(view)) {
    problems.push(`${code}: the read names a biggest jump that lifts nothing`);
  }
  const notInvited =
    view.stamp.kind === "combined" && view.stamp.label === "not-invited";
  const claims = [view.headline.h1, view.wait, view.improve.banner ?? ""];
  if (!notInvited && claims.some((t) => NO_VISA_INVITING.test(t))) {
    problems.push(
      `${code}: says no visa is inviting under a ${view.stamp.label} stamp`,
    );
  }
  return problems;
}

/** The planner (or lodged reader) at a level, before any changes. */
export function sweepProfile(points: number, lodged: boolean): Profile {
  return {
    ...PLANNER,
    ...LEVELS[points],
    eoiDate: lodged ? LODGED_ON : "",
  };
}

/** Every problem across the snapshot for one profile; [] when all is well. */
export function sweepProblems(points: number, lodged: boolean): string[] {
  const profile = sweepProfile(points, lodged);
  return OCCUPATIONS.flatMap(({ code, state }) =>
    problemsOf(code, viewOf({ ...profile, occupation: code }, state)),
  );
}
