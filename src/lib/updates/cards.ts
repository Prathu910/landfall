import type { MonthKey, Visa } from "../data/types";
import { formatMonth } from "../report/copy";
import { HANDLE } from "./social-spec";
import {
  dayText,
  formatLongMonth,
  formatNumber,
  longDayText,
  monthEnd,
  mrzLine,
} from "./format";
import {
  cutoffRangeText,
  occupationsText,
  round189Total,
  roundsNewestFirst,
} from "./round-view";
import {
  buildSpotlightCard,
  buildStateCard,
  type SpotlightCard,
  type StateCard,
} from "./cards-state";
import type { RecapFacts, RoundSection } from "./types";

export type CardId =
  | "cover"
  | "round-cover"
  | "round"
  | "state-190"
  | "state-491"
  | "spotlight"
  | "closing";

/** The text of one stamp; the template picks the round or rectangular frame. */
export type StampText = { top: string; word: string; bottom: string };

type CardBase = {
  /** "Oct 2026". */
  tag: string;
  /** Null only on the round card, which is shared by the round and month sets. */
  position: { index: number; of: number } | null;
  source: string;
  /** The visas the card shows figures for (drives the hashtags). */
  visas: Visa[];
};

export type CoverCard = CardBase & {
  id: "cover";
  eyebrow: string;
  titleLines: [string, string];
  sub: string;
  stamps: { round: StampText | null; s190: StampText; s491: StampText };
  swipe: string;
  mrz: string;
};

export type RoundCoverCard = CardBase & {
  id: "round-cover";
  eyebrow: string;
  titleLines: [string, string];
  sub: string;
  stamp: StampText;
  swipe: string;
  mrz: string;
};

export type RoundCard = CardBase & {
  id: "round";
  eyebrow: string;
  total: string;
  title: string;
  sub: string;
  stamp: StampText;
  distribution: {
    heading: string;
    bars: { score: string; count: string; share: number }[];
    axis: string;
  };
  /** Null when the round has no earlier round to compare with. */
  picks: {
    heading: string;
    items: { name: string; current: string; previous: string }[];
  } | null;
  notListed: string | null;
};

export type ClosingCard = CardBase & {
  id: "closing";
  stamp: StampText;
  title: string;
  url: string;
  handle: string;
  sub: string;
  disclaimer: string;
  disclaimerSmall: string;
};

export type CardView =
  | CoverCard
  | RoundCoverCard
  | RoundCard
  | StateCard
  | SpotlightCard
  | ClosingCard;

export type { SpotlightCard, StateCard };

export const SKILLSELECT_SOURCE = (asAt: string) =>
  `Source: SkillSelect EOI data (Australian Government), CC BY 3.0 AU · as at ${asAt}`;
export const ROUND_SOURCE = (date: string) =>
  `Source: Home Affairs invitation round, ${dayText(date)}`;

const COUNT_WORDS = ["zero", "one", "two", "three", "four", "five", "six"];
const countWord = (n: number) => COUNT_WORDS[n] ?? formatNumber(n);

const SUBCLASS_NAMES = "Skilled Independent";
const NOT_LISTED_NAMES = 3;

const withoutYear = (text: string) => text.replace(/ \d{4}$/, "");

function roundStamp(date: string, section: RoundSection): StampText {
  return {
    top: "SUBCLASS 189 ROUND",
    word: `${formatNumber(round189Total(section))} INVITED`,
    bottom: dayText(date).toUpperCase(),
  };
}

function stateStamp(visa: "190" | "491", month: MonthKey): StampText {
  return {
    top: `SUBCLASS ${visa}`,
    word: "BY STATE",
    bottom: `AS AT ${withoutYear(dayText(monthEnd(month))).toUpperCase()}`,
  };
}

function newestRound(facts: RecapFacts) {
  const [newest] = roundsNewestFirst(facts);
  return newest ?? null;
}

function titleLines(month: MonthKey): [string, string] {
  const [name, year] = formatLongMonth(month).split(" ");
  return [name, year];
}

function coverCard(
  facts: RecapFacts,
  position: CardBase["position"],
  cardsAfter: number,
): CoverCard {
  const round = newestRound(facts);
  const cards = `in the next ${countWord(cardsAfter)} cards.`;
  const month = formatLongMonth(facts.month).split(" ")[0];
  return {
    id: "cover",
    tag: formatMonth(facts.month),
    position,
    source: SKILLSELECT_SOURCE(dayText(monthEnd(facts.month))),
    visas: round ? ["189", "190", "491"] : ["190", "491"],
    eyebrow: "SkillSelect update",
    titleLines: titleLines(facts.month),
    sub: round
      ? `The 189 round of ${dayText(round.date)} and the ${month} data for 190 and 491, ${cards}`
      : `190 and 491 by state, and an occupation spotlight, ${cards}`,
    stamps: {
      round: round ? roundStamp(round.date, round.section) : null,
      s190: stateStamp("190", facts.month),
      s491: stateStamp("491", facts.month),
    },
    swipe: "Swipe",
    mrz: mrzLine(facts.month),
  };
}

function roundCoverCard(
  facts: RecapFacts,
  date: string,
  section: RoundSection,
  position: CardBase["position"],
): RoundCoverCard {
  const [day, month, year] = longDayText(date).split(" ");
  return {
    id: "round-cover",
    tag: formatMonth(facts.month),
    position,
    source: ROUND_SOURCE(date),
    visas: ["189"],
    eyebrow: "SkillSelect update · 189 round",
    titleLines: [`${day} ${month}`, year],
    sub: `${formatNumber(round189Total(section))} EOIs invited across ${occupationsText(section.occupations.length)}.`,
    stamp: roundStamp(date, section),
    swipe: "Swipe",
    mrz: mrzLine(facts.month),
  };
}

function notListedLine(section: RoundSection): string | null {
  const { comparison, previousRound } = section;
  if (!comparison || !previousRound) return null;
  const { notListedAgain } = comparison;
  if (notListedAgain.length === 0) return null;
  const names = notListedAgain.slice(0, NOT_LISTED_NAMES).map((o) => o.name);
  if (notListedAgain.length > NOT_LISTED_NAMES) names.push("others");
  return `Listed on ${dayText(previousRound.date)}, not this round (${formatNumber(notListedAgain.length)}): ${names.join(", ")}.`;
}

/** "4 Jun" in the round's own year, "13 Nov 2025" in an earlier one. */
function previousDayText(previous: string, current: string): string {
  const text = dayText(previous);
  return previous.slice(0, 4) === current.slice(0, 4)
    ? withoutYear(text)
    : text;
}

function picksView(section: RoundSection, date: string): RoundCard["picks"] {
  const { previousRound, cardPicks } = section;
  if (!previousRound || cardPicks.length === 0) return null;
  return {
    heading: "Lowest score invited",
    items: cardPicks.map((move) => ({
      name: move.name,
      current: String(move.current),
      previous: `was ${move.previous} on ${previousDayText(previousRound.date, date)}`,
    })),
  };
}

function roundCard(
  facts: RecapFacts,
  date: string,
  section: RoundSection,
): RoundCard {
  const total = formatNumber(round189Total(section));
  const tallest = Math.max(...section.distribution.map((d) => d.occupations));
  return {
    id: "round",
    tag: formatMonth(facts.month),
    position: null,
    source: ROUND_SOURCE(date),
    visas: ["189"],
    eyebrow: `189 · ${SUBCLASS_NAMES}`,
    total,
    title: `${total} EOIs invited`,
    sub: `in the 189 round of ${dayText(date)}, across ${occupationsText(section.occupations.length)}. Lowest scores invited ran ${cutoffRangeText(section)}.`,
    stamp: {
      top: "SUBCLASS 189",
      word: "ROUND",
      bottom: dayText(date).toUpperCase(),
    },
    distribution: {
      heading: "Occupations by lowest score invited",
      bars: section.distribution.map((d) => ({
        score: String(d.score),
        count: formatNumber(d.occupations),
        share: d.occupations / tallest,
      })),
      axis: "Lowest score invited (points) · number of occupations above each bar",
    },
    picks: picksView(section, date),
    notListed: notListedLine(section),
  };
}

function closingCard(
  facts: RecapFacts,
  position: CardBase["position"],
  source: string,
): ClosingCard {
  return closingCardFor(formatMonth(facts.month), position, source);
}

/** The closing card with any tag: the monthly sets and the launch pack share it. */
export function closingCardFor(
  tag: string,
  position: CardBase["position"],
  source: string,
): ClosingCard {
  return {
    id: "closing",
    tag,
    position,
    source,
    visas: [],
    stamp: {
      top: "MIGRATELENS",
      word: "FREE POINTS CHECK",
      bottom: "189 · 190 · 491",
    },
    title: "Check your points free",
    url: "migratelens.com",
    handle: HANDLE,
    sub: "Your points against the published invitation data for your occupation, in one report.",
    disclaimer: "General information, not migration advice.",
    disclaimerSmall:
      "MigrateLens is not a registered migration agent. Find one at mara.gov.au.",
  };
}

/** The round set: round cover, the round card and the closing card. */
export function roundSetCards(
  facts: RecapFacts,
  roundDate: string,
): CardView[] {
  const section = facts.rounds[roundDate];
  if (!section) throw new Error(`No round on ${roundDate} in ${facts.month}`);
  return [
    roundCoverCard(facts, roundDate, section, { index: 1, of: 3 }),
    roundCard(facts, roundDate, section),
    closingCard(facts, { index: 3, of: 3 }, ROUND_SOURCE(roundDate)),
  ];
}

/**
 * The month set: cover, the newest round's card (when the month has a round),
 * the two state cards, the spotlight and the closing card. Numbered by place
 * in the carousel.
 */
export function monthSetCards(facts: RecapFacts): CardView[] {
  const { data } = facts;
  if (!data)
    throw new Error(`${facts.month} has no data section for a month set`);
  const round = newestRound(facts);
  const of = round ? 6 : 5;
  const first = round ? 3 : 2;
  const at = (index: number) => ({ index, of });
  const source = SKILLSELECT_SOURCE(dayText(monthEnd(facts.month)));
  return [
    coverCard(facts, at(1), of - 1),
    ...(round ? [roundCard(facts, round.date, round.section)] : []),
    buildStateCard("190", facts, data, at(first), source),
    buildStateCard("491", facts, data, at(first + 1), source),
    buildSpotlightCard(facts, data, at(first + 2), source),
    closingCard(facts, at(of), source),
  ];
}

/** Keys that are not text on the card. */
const HIDDEN_KEYS = new Set(["id", "visas", "position", "share"]);

function collect(value: unknown, out: string[]): void {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collect(item, out);
  else if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      if (!HIDDEN_KEYS.has(key)) collect(item, out);
    }
  }
}

/** Every visible string on a card, including the "3/6" beside the tag. */
export function cardStrings(card: CardView): string[] {
  const out: string[] = [];
  collect(card, out);
  if (card.position) out.push(`${card.position.index}/${card.position.of}`);
  return out;
}
