import { invitationActivity } from "../data/invitations";
import type {
  Interval,
  MonthKey,
  OccupationCore,
  StateVisa,
} from "../data/types";
import { formatCount, formatMonth, isMasked } from "./copy";
import { buildWhereYouStand, type WhereYouStand } from "./panel-189";

export type InvitationRow = { month: MonthKey; label: string; text: string };

export type NominatedPanel = {
  visa: StateVisa;
  heading: string;
  whereYouStand: WhereYouStand;
  invitationsHeading: string;
  nationalNote: string;
  invitations: InvitationRow[];
  statesLink: { href: `#state-outlook-${StateVisa}`; text: string };
};

const MONTHS_SHOWN = 12;
const NATIONAL_NOTES: Record<StateVisa, string> = {
  "190": "This is the national pool. States select by their own rules.",
  "491":
    "This is the national pool for state/territory nominated 491, excluding family sponsorship. States select by their own rules.",
};

function invitedText(invited: Interval, label: string): string {
  if (invited.max === 0) return `none recorded (as at ${label})`;
  if (isMasked(invited)) {
    return `under 20 invited, so may be zero (as at ${label})`;
  }
  return `at least ${formatCount({ min: invited.min, max: invited.min })} invited (as at ${label})`;
}

/** The 12 calendar months back from the snapshot, newest first, never summed. */
function invitationRows(
  core: OccupationCore,
  visa: StateVisa,
): InvitationRow[] {
  const activity = invitationActivity(core, visa, MONTHS_SHOWN);
  const invited = new Map(
    activity.months.map((m) => [m.asAt, m.invitedAtLeast]),
  );
  const months = [
    ...activity.months.map((m) => m.asAt),
    ...activity.notPublished,
  ].sort((a, b) => b.localeCompare(a));
  return months.map((month) => {
    const label = formatMonth(month);
    const count = invited.get(month);
    return {
      month,
      label,
      text: count
        ? invitedText(count, label)
        : `not published (as at ${label})`,
    };
  });
}

export function buildNominatedPanel(
  core: OccupationCore,
  visa: StateVisa,
  score: number,
): NominatedPanel {
  return {
    visa,
    heading: `Where you stand in the national ${visa} pool`,
    whereYouStand: buildWhereYouStand(core, score, visa),
    nationalNote: NATIONAL_NOTES[visa],
    // INVITED counts every state's nominations together.
    invitationsHeading: "Invitations recorded, all states",
    invitations: invitationRows(core, visa),
    statesLink: {
      href: `#state-outlook-${visa}`,
      text: "See your state outlook",
    },
  };
}
