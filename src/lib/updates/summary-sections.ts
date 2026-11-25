/**
 * The fact sections of the data-update PR summary (spec 6.12 items 2 to 6),
 * as Markdown lines. Every number goes through `format.ts`, so masked counts
 * stay ranges or lower bounds.
 */
import type { MonthKey, StateVisa, Visa } from "../data/types";
import {
  formatNumber,
  intervalText,
  leastText,
  longDayText,
  monthEnd,
  rangeText,
  stateFigureText,
} from "./format";
import type {
  DataSection,
  OccRef,
  RecapFacts,
  RoundSection,
  StateFigure,
} from "./types";

const VISAS: Visa[] = ["189", "190", "491"];
const STATE_VISAS: StateVisa[] = ["190", "491"];
const LIST_LIMIT = 40;

export const named = (o: { code: string | null; name: string }) =>
  o.code ? `${o.name} (${o.code})` : o.name;

/** Names in one sentence, capped so a long list stays readable. */
function nameList(items: OccRef[]): string {
  const shown = items.slice(0, LIST_LIMIT).map(named).join("; ");
  const more = items.length - LIST_LIMIT;
  return more > 0 ? `${shown}; and ${formatNumber(more)} more` : shown;
}

/** Item 2: SUBMITTED pools last month to this month, and invitations held. */
export function poolLines(data: DataSection, month: MonthKey): string[] {
  const rows = VISAS.flatMap((visa) => {
    const { submitted, invited } = data.national[visa];
    const was = submitted.previous
      ? intervalText(submitted.previous)
      : "no previous month";
    const held = invited.previous
      ? `${leastText(invited.previous)} → ${leastText(invited.current)}`
      : leastText(invited.current);
    return [
      `- ${visa} pool: ${was} → ${intervalText(submitted.current)} EOIs`,
      `- ${visa} holding an invitation (a minimum): ${held} EOIs`,
    ];
  });
  return [
    `EOIs submitted, as at ${longDayText(monthEnd(month))}, against the previous month. A pool change is not new interest.`,
    "",
    ...rows,
  ];
}

function previousFloorText(f: StateFigure): string {
  if (f.previousFloor === null) return "no previous month";
  return f.previousFloor > 0
    ? `at least ${formatNumber(f.previousFloor)}`
    : "no count of 20 or more";
}

/** Item 4: a table of state floors this month and last, for each state visa. */
export function stateLines(data: DataSection): string[] {
  return STATE_VISAS.flatMap((visa) => [
    `**${visa}, EOIs holding an invitation, by state (minimums)**`,
    "",
    "| State | This month | Last month |",
    "| --- | --- | --- |",
    ...Object.entries(data.states[visa]).map(
      ([state, f]) =>
        `| ${state === "ANY" ? "State not recorded" : state} | ${stateFigureText(f)} | ${previousFloorText(f)} |`,
    ),
    "",
  ]);
}

/** Item 3: one 189 round. */
export function roundLines(date: string, round: RoundSection): string[] {
  const invited = round.totals.find((t) => t.subclass === "189")?.invited;
  const scores = round.occupations.map((o) => o.cutoff);
  const lowest = scores.length
    ? rangeText({ min: Math.min(...scores), max: Math.max(...scores) })
    : null;
  const c = round.comparison;
  return [
    `**189 round of ${longDayText(date)}**`,
    "",
    `- EOIs invited: ${invited === undefined ? "not published" : formatNumber(invited)}`,
    `- Occupations listed: ${formatNumber(round.occupations.length)}`,
    ...(lowest
      ? [`- Lowest score invited, across occupations: ${lowest} points`]
      : []),
    ...(c
      ? [
          `- Against the previous round: ${formatNumber(c.fell)} fell, ${formatNumber(c.rose)} rose, ${formatNumber(c.same)} stayed the same`,
          `- Newly listed: ${c.newlyListed.length ? nameList(c.newlyListed) : "none"}`,
          `- Not listed again: ${c.notListedAgain.length ? nameList(c.notListedAgain) : "none"}`,
        ]
      : ["- No previous round to compare with"]),
  ];
}

/** Item 3 for a data update: every round that month, oldest first. */
export function roundsInMonth(facts: RecapFacts): string[] {
  const dates = Object.keys(facts.rounds).sort();
  return dates.length
    ? dates.flatMap((d) => [...roundLines(d, facts.rounds[d]), ""])
    : ["No 189 round is stored for this month."];
}

/** Item 5: occupations added or removed. */
export function occupationLines(data: DataSection): string[] {
  const { occupationsAdded: added, occupationsRemoved: removed } = data;
  if (added === null || removed === null) {
    return ["No previous month to compare with."];
  }
  return [
    `- Added: ${added.length ? nameList(added) : "none"}`,
    `- Removed: ${removed.length ? `${nameList(removed)}. A removed occupation keeps its page with its last published data.` : "none"}`,
  ];
}

const moverLine = (m: {
  code: string;
  name: string;
  previous: number;
  current: number;
}) =>
  `- ${named(m)}: ${formatNumber(m.previous)} → ${formatNumber(m.current)} EOIs`;

const PICK_REASON: Record<string, string> = {
  "SUBMITTED-189": "its 189 pool",
  "SUBMITTED-190": "its 190 pool",
  "SUBMITTED-491": "its 491 pool",
  "INVITED-189": "EOIs holding a 189 invitation",
  "INVITED-190": "EOIs holding a 190 invitation",
  "INVITED-491": "EOIs holding a 491 invitation",
};

/** Item 6: exact-count movers, and the spotlight pick with its reason. */
export function moverLines(data: DataSection, month: MonthKey): string[] {
  const { spotlight: s, movers } = data;
  const q = s.qualifiedBy;
  const why =
    s.pickedBy === "founder"
      ? "picked by the founder"
      : q
        ? `picked because ${PICK_REASON[q.series]} changed by at least ${formatNumber(q.guaranteed)} EOIs`
        : "picked because little changed this month";
  return [
    "**Pool fell** (both months exact)",
    "",
    ...(movers.fell.length ? movers.fell.map(moverLine) : ["- none"]),
    "",
    "**Pool rose** (both months exact)",
    "",
    ...(movers.rose.length ? movers.rose.map(moverLine) : ["- none"]),
    "",
    `Spotlight: ${named(s)}, ${why}. To swap it, run the monthly workflow from the Actions tab with month ${month} and the new occupation code as the spotlight.`,
  ];
}
