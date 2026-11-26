import { parseCountText, sumIntervals } from "../data/published-count";
import { monthEnd } from "../data/report-source";
import type { OccupationCore, StateCode, StateVisa } from "../data/types";
import { formatDate } from "../migration";
import { formatMonth } from "../report/copy";
import { summarise189Rounds } from "../report/round-status";
import { joinWords } from "../state-outlook/context";
import type { StateRow } from "./states";
import { STATE_ORDER } from "./states";

/**
 * The opening answer of an occupation page (audit A-P1-7): dated, with the
 * code, for the 189 first and then the 190 and 491. Every figure comes from
 * the occupation's core and the imported state lists; a masked count is
 * never read as zero, so a state is named only when its published range
 * starts above zero.
 */

const CHECKING = "Rules being checked";

/** "31 Oct 2026": the SkillSelect as-at day of the occupation's snapshot. */
export function asAtDay(core: OccupationCore): string {
  return formatDate(monthEnd(core.asAt));
}

/** "Registered Nurses nec (ANZSCO 254499)". */
export function withCode(core: OccupationCore): string {
  return `${core.name} (ANZSCO ${core.code})`;
}

function cutoffSpan(cutoffs: number[]): string {
  const lo = Math.min(...cutoffs);
  const hi = Math.max(...cutoffs);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

/**
 * The 189 sentence that opens the page when the occupation has a 189 pool,
 * dated by its rounds (R9). The round job adds a round before that month's
 * pool data, so the sentence never puts the snapshot's "As at" in front of
 * a newer round's date.
 */
export function dated189Sentence(core: OccupationCore): string {
  const summary = summarise189Rounds(core.rounds189);
  const newest = core.rounds189[0]?.date;
  const span =
    summary.roundsConsidered === 4 ? "four" : `${summary.roundsConsidered}`;
  const last = summary.latestCutoff;
  if (summary.status === "none" || !last) {
    const upTo = newest ? `, up to ${formatDate(newest)}` : "";
    return last
      ? `189 hasn't listed ${withCode(core)} in its last ${span} rounds${upTo}; it was last listed on ${formatDate(last.date)}, at ${last.cutoff} points.`
      : `189 hasn't listed ${withCode(core)} in any round we can read${upTo}.`;
  }
  const listed = core.rounds189
    .slice(0, 4)
    .flatMap((r) => (r.cutoff === null ? [] : [r.cutoff]));
  const history =
    summary.status === "regular"
      ? `each of its last ${span} rounds listed it, at ${cutoffSpan(listed)} points`
      : `189 listed it in ${summary.listedInLastFour} of its last ${span} rounds, at ${cutoffSpan(listed)} points`;
  return `The latest 189 round to list ${withCode(core)}, on ${formatDate(last.date)}, had a cut-off of ${last.cutoff} points; ${history}.`;
}

/**
 * Puts the snapshot's as-at date in front of a pool sentence, and the code
 * after the name when the sentence names the occupation.
 */
export function datedLead(core: OccupationCore, poolLead: string): string {
  const named = poolLead.replace(core.name, withCode(core));
  const opening = /^(No|The) /.test(named)
    ? named[0].toLowerCase() + named.slice(1)
    : named;
  return `As at ${asAtDay(core)}, ${opening}`;
}

/** "NSW and QLD list it for 190", "WA lists it for 190 and 491". */
function listing(rows: StateRow[], visas: string): string | null {
  const codes = rows.filter((r) => r.onList === visas).map((r) => r.state);
  if (codes.length === 0) return null;
  return `${joinWords(codes, "and")} ${codes.length === 1 ? "lists" : "list"} it for ${visas}`;
}

/**
 * "For 2026–27, QLD and WA list it for 190 and 491; NSW lists it for 190",
 * "None of NSW and QLD lists it for 2026–27", or null when every state's
 * rules are still being checked.
 */
export function stateListClause(rows: StateRow[]): string | null {
  const parts = ["190 and 491", "190", "491"].flatMap(
    (visas) => listing(rows, visas) ?? [],
  );
  if (parts.length > 0) return `For 2026–27, ${parts.join("; ")}`;
  const checked = rows.filter((r) => r.onList !== CHECKING);
  if (checked.length === 0) return null;
  return `None of ${joinWords(
    checked.map((r) => r.state),
    "and",
  )} lists it for 2026–27`;
}

/** States whose published invited count for the visa is certainly above zero. */
export function invitedStates(
  core: OccupationCore,
  visa: StateVisa,
): StateCode[] {
  return STATE_ORDER.filter((state) => {
    const month = core.stateInvited[visa]?.[state]?.[core.asAt];
    if (!month) return false;
    return sumIntervals(Object.values(month).map(parseCountText)).min > 0;
  });
}

/** "the 190 from NSW and VIC and the 491 from SA", or null when none is certain. */
function invitedClause(core: OccupationCore): string | null {
  const parts = (["190", "491"] as const).flatMap((visa) => {
    const states = invitedStates(core, visa);
    if (states.length === 0) return [];
    const from =
      states.length === STATE_ORDER.length
        ? "all eight states and territories"
        : joinWords(states, "and");
    return [`the ${visa} from ${from}`];
  });
  return parts.length > 0 ? joinWords(parts, "and") : null;
}

/**
 * The 190 and 491 sentence of the opening answer: which states list the
 * occupation, and which held EOIs in invited status at the snapshot (a
 * status count, not invitations issued in the month).
 */
export function statesSentence(
  core: OccupationCore,
  rows: StateRow[],
): string | null {
  const list = stateListClause(rows);
  const invited = invitedClause(core);
  const shown = `SkillSelect showed EOIs in invited status for ${invited}`;
  const month = formatMonth(core.asAt);
  if (list && invited) return `${list}; as at ${month}, ${shown}.`;
  if (list) return `${list}.`;
  if (invited) return `As at ${month}, ${shown}.`;
  return null;
}
