import { closingCardFor, type ClosingCard } from "../updates/cards";
import type { LaunchCard, LaunchStamp, Position } from "./launch-types";

/** The swipe cue on every cover, as the monthly sets. */
export const SWIPE = "Swipe";

export const NOT_ADVICE = "General information, not migration advice.";

/** The site's address as cards and captions write it. */
export const SITE = "migratelens.com";

/** "migratelens.com/guide/points-table/" from a site path. */
export const siteUrl = (path: string) => `${SITE}${path === "/" ? "" : path}`;

/** The three visas as neutral stamps: subclass and name, never an outcome. */
export const VISA_STAMPS: Record<"189" | "190" | "491", LaunchStamp> = {
  "189": {
    shape: "round",
    top: "SUBCLASS",
    word: "189",
    bottom: "SKILLED INDEPENDENT",
  },
  "190": {
    shape: "rect",
    top: "SUBCLASS",
    word: "190",
    bottom: "STATE NOMINATED",
  },
  "491": {
    shape: "rect",
    top: "SUBCLASS",
    word: "491",
    bottom: "SKILLED REGIONAL",
  },
};

/** The decorative passport line, 44 characters: "P<AUSMIGRATELENS<<POINTS<TABLE<<<…". */
export function launchMrz(words: string[]): string {
  const body = words
    .map((word) => word.toUpperCase().replace(/[^A-Z0-9]+/g, "<"))
    .join("<");
  return `P<AUSMIGRATELENS<<${body}`.padEnd(44, "<").slice(0, 44);
}

/** Numbers a post's cards "1/N" to "N/N", in order. */
export function numbered<T extends LaunchCard>(cards: T[]): T[] {
  return cards.map((card, i) => ({
    ...card,
    position: { index: i + 1, of: cards.length } satisfies Position,
  }));
}

/** The monthly sets' closing card, with the post's tag and source. */
export function closing(
  tag: string,
  source: string,
  title?: string,
): ClosingCard {
  const card = closingCardFor(tag, null, source);
  return title ? { ...card, title } : card;
}

/** A sentence ends with a full stop unless it already ends a sentence. */
export const sentence = (text: string) =>
  /[.!?]$/.test(text) ? text : `${text}.`;
