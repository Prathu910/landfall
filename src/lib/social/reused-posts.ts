import { monthSetCards, roundSetCards, type CardView } from "../updates/cards";
import { dayText, formatLongMonth, monthEnd } from "../updates/format";
import { roundsNewestFirst } from "../updates/round-view";
import { altText } from "../updates/social-copy";
import type { RecapFacts } from "../updates/types";
import { siteUrl } from "./launch-common";
import type { CaptionParts, Slide } from "./launch-types";

/**
 * Posts 2 and 3 reuse the monthly sets' light and dark PNGs, never
 * re-rendered (brief): the round set, and the month set with the round
 * set's card 2, the way the month set's own `set.json` lists it. Paths
 * follow scripts/social/jobs.ts (its test holds them equal).
 */

const THEMES = ["light", "dark"] as const;
const stem = (card: CardView) =>
  card.id === "round-cover" ? "cover" : card.id;

export const roundSetDir = (month: string, date: string) =>
  `public/social/${month}/round-${date}`;
export const monthSetDir = (month: string) => `public/social/${month}/month`;

function files(dir: string, card: CardView): { light: string; dark: string } {
  const [light, dark] = THEMES.map((t) => `${dir}/${stem(card)}-${t}.png`);
  return { light, dark };
}

function newestRoundDate(facts: RecapFacts): string {
  const [newest] = roundsNewestFirst(facts);
  if (!newest) throw new Error(`${facts.month} has no 189 round to reuse`);
  return newest.date;
}

/** Post 2: the newest round set (cover, card 2, closing). */
export function roundPostSlides(facts: RecapFacts): Slide[] {
  const date = newestRoundDate(facts);
  const dir = roundSetDir(facts.month, date);
  const cards = roundSetCards(facts, date);
  return cards.map((card, i) => ({
    kind: "reused",
    files: files(dir, card),
    // Card 2 has no position of its own (it is shared with the month set).
    alt: altText({ ...card, position: { index: i + 1, of: cards.length } }),
  }));
}

/** Post 3: the month set, its card 2 taken from the round set. */
export function monthPostSlides(facts: RecapFacts): Slide[] {
  const date = newestRoundDate(facts);
  const cards = monthSetCards(facts);
  return cards.map((card, i) => {
    const round = card.id === "round";
    const numbered = round
      ? { ...card, position: { index: i + 1, of: cards.length } }
      : card;
    return {
      kind: "reused",
      files: files(
        round ? roundSetDir(facts.month, date) : monthSetDir(facts.month),
        card,
      ),
      alt: altText(numbered),
    };
  });
}

const findCard = <Id extends CardView["id"]>(cards: CardView[], id: Id) =>
  cards.find((c): c is Extract<CardView, { id: Id }> => c.id === id);

export function roundPostCaption(facts: RecapFacts): CaptionParts {
  const date = newestRoundDate(facts);
  const cards = roundSetCards(facts, date);
  const round = findCard(cards, "round");
  if (!round) throw new Error("The round set has no round card");
  return {
    hook: `The 189 round of ${dayText(date)}, in ${cards.length} cards.`,
    body: [
      `${round.title} ${round.sub}`,
      ...(round.notListed ? [round.notListed] : []),
    ],
    cta: "Comment your occupation and we'll reply with its cut-off in this round.",
    link: `The full round: ${siteUrl(`/updates/${facts.month}/`)}`,
    hashtags: [
      "#189visa",
      "#SkillSelect",
      "#AustraliaPR",
      "#InvitationRound",
      "#EOI",
      "#AustralianImmigration",
      "#SkilledMigration",
    ],
  };
}

export function monthPostCaption(facts: RecapFacts): CaptionParts {
  const cards = monthSetCards(facts);
  const end = dayText(monthEnd(facts.month));
  const round = findCard(cards, "round");
  const spotlight = findCard(cards, "spotlight");
  return {
    hook: `SkillSelect, ${formatLongMonth(facts.month)}: the round, the states and one occupation.`,
    body: [
      ...(round ? [`${round.title} ${round.sub}`] : []),
      `190 and 491 EOIs holding an invitation by state, as at ${end}, with every figure a minimum.`,
      ...(spotlight
        ? [`Occupation spotlight: ${spotlight.name}, as at ${end}.`]
        : []),
    ],
    cta: "Save this for your EOI.",
    link: `Full figures and sources: ${siteUrl(`/updates/${facts.month}/`)}`,
    hashtags: [
      "#SkillSelect",
      "#AustraliaPR",
      "#189visa",
      "#190visa",
      "#491visa",
      "#StateNomination",
      "#AustralianImmigration",
    ],
  };
}
