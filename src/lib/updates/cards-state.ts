import { shiftMonth } from "../data/months";
import { parseCountText } from "../data/published-count";
import type { CountText, MonthKey, StateCode, StateVisa } from "../data/types";
import { formatMonth } from "../report/copy";
import type { StampText } from "./cards";
import {
  countText,
  dayText,
  formatNumber,
  monthEnd,
  stateFigureText,
} from "./format";
import { buildStateSection, STATE_ORDER, type ShadeBand } from "./state-view";
import type { DataSection, RecapFacts, Spotlight } from "./types";

type Position = { index: number; of: number } | null;

const VISA_NAMES: Record<StateVisa, string> = {
  "190": "Skilled Nominated",
  "491": "State-nominated regional",
};

type StateCardOf<V extends StateVisa> = {
  id: `state-${V}`;
  tag: string;
  position: Position;
  source: string;
  visas: V[];
  eyebrow: string;
  title: string;
  sub: string;
  map: Record<StateCode, { big: string; small: string; shade: ShadeBand }>;
  legend: { shade: ShadeBand; label: string }[];
  /** "State not recorded: at least 243"; never added to a state. */
  notRecorded: string;
  note: string;
};

export type StateCard = StateCardOf<"190"> | StateCardOf<"491">;

/** The 190 or 491 card: the recap page's map, legend and figures, compacted. */
export function buildStateCard(
  visa: StateVisa,
  facts: RecapFacts,
  data: DataSection,
  position: Position,
  source: string,
): StateCard {
  // The page's own state section, so a card and the page cannot disagree.
  const section = buildStateSection(visa, data, facts.month, (ref) => ({
    name: ref.name,
    href: null,
  }));
  const figures = data.states[visa];
  const end = dayText(monthEnd(facts.month));
  const previousEnd = dayText(monthEnd(shiftMonth(facts.month, -1)));
  const allUnder20 = STATE_ORDER.every((s) => figures[s].previousFloor === 0);
  return {
    id: `state-${visa}`,
    tag: formatMonth(facts.month),
    position,
    source,
    visas: [visa],
    eyebrow: `${visa} · ${VISA_NAMES[visa]}`,
    title: `${visa} by state`,
    sub: `EOIs holding a ${visa} invitation on ${end}, by the state that invited them. Every figure is a minimum.`,
    map: section.map,
    legend: section.legend,
    notRecorded: `State not recorded: ${stateFigureText(figures.ANY)}`,
    note: [
      allUnder20
        ? `On ${previousEnd} every state was under 20 for each occupation.`
        : null,
      "Counts under 20 are hidden, so true totals are higher.",
    ]
      .filter((s): s is string => s !== null)
      .join(" "),
  } as StateCard;
}

export type SpotlightCard = {
  id: "spotlight";
  tag: string;
  position: Position;
  source: string;
  visas: ("189" | "190")[];
  eyebrow: string;
  name: string;
  code: string;
  /** Null when the occupation isn't on the federal list for 189. */
  stamp: StampText | null;
  /** "189 isn't available for this occupation"; null otherwise. */
  unavailable: string | null;
  /** "Little changed this month" when no change qualified the pick. */
  littleChanged: string | null;
  facts: { big: string; label: string }[];
  rounds: {
    heading: string;
    columns: { label: string; value: string; cutoff: number | null }[];
  };
  tieBreak: string | null;
  states190: string | null;
};

const ROUND_COUNT_HEADINGS = [
  "",
  "Latest 189 round",
  "Last two 189 rounds",
  "Last three 189 rounds",
  "Last four 189 rounds",
  "Last five 189 rounds",
  "Last six 189 rounds",
];

/** "at least 2,730" as a big figure; an exact count stays exact, "<20" is "under 20". */
function bigCount(text: CountText, minimum: boolean): string {
  if (text === "<20") return "under 20";
  return minimum && parseCountText(text).min > 0
    ? `${countText(text)}+`
    : countText(text);
}

function countFact(
  visa: "189",
  kind: "invited" | "pool",
  pair: { current: CountText | null; previous: CountText | null },
  end: string,
  previousEnd: string,
): SpotlightCard["facts"] {
  if (pair.current === null) return [];
  const earlier = pair.previous
    ? ` (${pair.previous === "<20" ? "under 20" : countText(pair.previous)} on ${previousEnd})`
    : "";
  return [
    {
      big: bigCount(pair.current, kind === "invited"),
      label:
        kind === "invited"
          ? `EOIs, at least, held a ${visa} invitation on ${end}${earlier}`
          : `EOIs in the ${visa} pool on ${end}${earlier}`,
    },
  ];
}

function stampFor(card: Spotlight["card"]): StampText | null {
  const { latest189 } = card;
  if (latest189.kind === "not-on-list") return null;
  const when = dayText(latest189.date).toUpperCase();
  return latest189.kind === "listed"
    ? {
        top: `189 · ${when}`,
        word: `${latest189.cutoff} PTS`,
        bottom: "LOWEST INVITED",
      }
    : { top: `189 · ${when}`, word: "NOT LISTED", bottom: "IN THE ROUND" };
}

function tieBreakText(card: Spotlight["card"]): string | null {
  const { latest189, tieBreak } = card;
  if (latest189.kind !== "listed" || tieBreak === null) return null;
  return `At ${latest189.cutoff} points, EOIs that reached the score by ${dayText(tieBreak)} were invited (tie-break date).`;
}

/** The occupation spotlight card, from the data section's spotlight facts (R10). */
export function buildSpotlightCard(
  facts: RecapFacts,
  data: DataSection,
  position: Position,
  source: string,
): SpotlightCard {
  const { card, code, name, qualifiedBy } = data.spotlight;
  const month: MonthKey = facts.month;
  const end = dayText(monthEnd(month));
  const previousEnd = dayText(monthEnd(shiftMonth(month, -1)));
  const states = card.top190.map(
    (s) => `${s.state} at least ${formatNumber(s.floor)}`,
  );
  return {
    id: "spotlight",
    tag: formatMonth(month),
    position,
    source,
    visas: card.top190.length > 0 ? ["189", "190"] : ["189"],
    eyebrow: "Occupation spotlight",
    name,
    code: `ANZSCO ${code}`,
    stamp: stampFor(card),
    unavailable:
      card.latest189.kind === "not-on-list"
        ? "189 isn't available for this occupation"
        : null,
    littleChanged: qualifiedBy === null ? "Little changed this month." : null,
    facts: [
      ...countFact("189", "invited", card.invited189, end, previousEnd),
      ...countFact("189", "pool", card.pool189, end, previousEnd),
    ],
    rounds: {
      heading: ROUND_COUNT_HEADINGS[card.rounds.length] ?? "Recent 189 rounds",
      columns: [...card.rounds].reverse().map((r) => ({
        label: dayText(r.date),
        value: r.cutoff === null ? "Not listed" : String(r.cutoff),
        cutoff: r.cutoff,
      })),
    },
    tieBreak: tieBreakText(card),
    states190:
      states.length > 0
        ? `190 invitations on ${end}: ${states.join(", ")}.`
        : null,
  };
}
