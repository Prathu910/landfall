import type { Visa } from "../data/types";
import type { CardView, RoundCard, SpotlightCard, StampText } from "./cards";
import { dayText, formatLongMonth, monthEnd } from "./format";
import type { RecapFacts } from "./types";

/** The hashtags every caption draws from; the visa tags follow the cards' content. */
export const HASHTAGS = {
  always: ["#australiapr", "#skillselect"],
  "189": "#189visa",
  "190": "#190visa",
  "491": "#491visa",
} as const;

const VISA_ORDER: Visa[] = ["189", "190", "491"];
const DISCLAIMER = "General information, not migration advice.";

/** The always tags, then each visa tag any card shows figures for, in 189/190/491 order. */
export function hashtagsFor(cards: CardView[]): string[] {
  const shown = new Set(cards.flatMap((card) => card.visas));
  return [
    ...HASHTAGS.always,
    ...VISA_ORDER.filter((v) => shown.has(v)).map((v) => HASHTAGS[v]),
  ];
}

const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

function findCard<Id extends CardView["id"]>(
  cards: CardView[],
  id: Id,
): Extract<CardView, { id: Id }> | undefined {
  return cards.find((c): c is Extract<CardView, { id: Id }> => c.id === id);
}

function roundSentences(round: RoundCard): string[] {
  return [`${round.title} ${round.sub}`];
}

function monthSentences(cards: CardView[], facts: RecapFacts): string[] {
  const end = dayText(monthEnd(facts.month));
  const round = findCard(cards, "round");
  const spotlight = findCard(cards, "spotlight");
  return [
    `SkillSelect update for ${formatLongMonth(facts.month)}.`,
    ...(round ? roundSentences(round) : []),
    `190 and 491 EOIs by state, as at ${end}, with every figure a minimum.`,
    ...(spotlight
      ? [`Occupation spotlight: ${spotlight.name}, as at ${end}.`]
      : []),
  ];
}

/** The Instagram caption: dated sentences, the recap link, the disclaimer, then the hashtags. */
export function caption(
  kind: "round" | "month",
  cards: CardView[],
  facts: RecapFacts,
): string {
  const round = findCard(cards, "round");
  const body =
    kind === "round" && round
      ? roundSentences(round)
      : monthSentences(cards, facts);
  return [
    body.map(sentence).join(" "),
    `Full figures and sources: migratelens.com/updates/${facts.month}/`,
    DISCLAIMER,
    "",
    hashtagsFor(cards).join(" "),
  ].join("\n");
}

const stampText = (s: StampText) => `${s.top}, ${s.word}, ${s.bottom}`;

/** "at least 790" from a map cell's big figure and small line. */
function cellText(cell: { big: string; small: string }): string {
  return /^(at least|about)\b/.test(cell.small)
    ? `${cell.small} ${cell.big}`
    : `${cell.big} ${cell.small}`;
}

function spotlightParts(card: SpotlightCard): (string | null)[] {
  return [
    card.eyebrow,
    `${card.name}, ${card.code}`,
    card.stamp && `Stamp: ${stampText(card.stamp)}`,
    card.unavailable,
    card.littleChanged,
    ...card.facts.map((f) => `${f.big} ${f.label}`),
    `${card.rounds.heading}, lowest score invited: ${card.rounds.columns
      .map((c) => `${c.label} ${c.value}`)
      .join("; ")}`,
    card.tieBreak,
    card.states190,
  ];
}

function altParts(card: CardView): (string | null)[] {
  switch (card.id) {
    case "cover":
      return [
        `${card.eyebrow}: ${card.titleLines.join(" ")}`,
        card.sub,
        ...[card.stamps.round, card.stamps.s190, card.stamps.s491].map(
          (s) => s && `Stamp: ${stampText(s)}`,
        ),
      ];
    case "round-cover":
      return [
        `${card.eyebrow}: ${card.titleLines.join(" ")}`,
        card.sub,
        `Stamp: ${stampText(card.stamp)}`,
      ];
    case "round":
      return [
        card.eyebrow,
        `${card.title} ${card.sub}`,
        `${card.distribution.heading}: ${card.distribution.bars
          .map((b) => `${b.score} points, ${b.count}`)
          .join("; ")}`,
        card.picks &&
          `${card.picks.heading}: ${card.picks.items
            .map((p) => `${p.name} ${p.current} (${p.previous})`)
            .join("; ")}`,
        card.notListed,
      ];
    case "state-190":
    case "state-491":
      return [
        card.eyebrow,
        `${card.title}. ${card.sub}`,
        Object.entries(card.map)
          .map(([state, cell]) => `${state} ${cellText(cell)}`)
          .join("; "),
        card.notRecorded,
        card.note,
      ];
    case "spotlight":
      return spotlightParts(card);
    case "closing":
      return [
        `${card.title}, ${card.url}`,
        card.sub,
        `${card.handle}. ${card.disclaimer}`,
      ];
  }
}

/** Every figure the card shows, in reading order, for the image's alt text. */
export function altText(card: CardView): string {
  const where = card.position
    ? `Card ${card.position.index} of ${card.position.of}. `
    : "";
  const text =
    where +
    altParts(card)
      .filter((p): p is string => p !== null && p !== "")
      .map(sentence)
      .join(" ");
  return text;
}
