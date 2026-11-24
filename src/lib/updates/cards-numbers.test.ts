import { describe, expect, it } from "vitest";
import { pagesFor } from "./__fixtures__/occupation-pages";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import {
  cardStrings,
  monthSetCards,
  roundSetCards,
  type CardView,
} from "./cards";
import { dayText, formatNumber, monthEnd } from "./format";
import { listRecapMonths, loadRecap } from "./load-server";
import { buildRecapView } from "./recap-view";
import type { RecapFacts } from "./types";
import { shiftMonth } from "../data/months";

const NUMBER = /\d[\d,–.]*/g;
const MRZ = /^P</;
/** Fixed copy on every card: the visa names and the "under 20" masking rule. */
const VISAS = ["189", "190", "491", "20"];

const tokens = (text: string): string[] =>
  (text.match(NUMBER) ?? []).map((t) => t.replace(/[,.–]+$/, ""));

function leaves(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(leaves);
  }
  return [];
}

/** The same numbers the spotlight facts hold, written as the card writes them. */
function spotlightTokens(facts: RecapFacts): Set<string> {
  const out = new Set<string>(VISAS);
  const add = (value: unknown): void => {
    if (typeof value === "number") out.add(formatNumber(Math.abs(value)));
    else if (typeof value === "string") {
      if (/^\d+$/.test(value)) {
        out.add(value);
        out.add(formatNumber(Number(value)));
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        for (const t of tokens(dayText(value))) out.add(t);
      }
    } else if (Array.isArray(value)) value.forEach(add);
    else if (typeof value === "object" && value !== null) {
      Object.values(value).forEach(add);
    }
  };
  add(facts.data?.spotlight);
  for (const end of [
    monthEnd(facts.month),
    monthEnd(shiftMonth(facts.month, -1)),
  ]) {
    for (const t of tokens(dayText(end))) out.add(t);
  }
  return out;
}

const FILES: [string, RecapFacts][] = [
  ...listRecapMonths().map((m): [string, RecapFacts] => [m, loadRecap(m)]),
  ["round-only fixture", roundOnly],
  ["data-only fixture", dataOnly],
  ["two-rounds fixture", twoRounds],
];

function setsFor(facts: RecapFacts): CardView[] {
  const rounds = Object.keys(facts.rounds);
  return [
    ...(facts.data ? monthSetCards(facts) : []),
    ...rounds.flatMap((date) => roundSetCards(facts, date)),
  ];
}

describe("card numbers match the recap", () => {
  it.each(FILES)("%s: every number on a card is on the page", (_n, facts) => {
    const view = buildRecapView(facts, {
      recapMonths: listRecapMonths(),
      occupationPages: pagesFor(facts),
    });
    const page = new Set([...VISAS, ...leaves(view).flatMap(tokens)]);
    const spotlight = spotlightTokens(facts);
    for (const card of setsFor(facts)) {
      const own = cardStrings(card).filter(
        (s) => s !== card.tag && !MRZ.test(s) && s !== card.source,
      );
      const position = card.position
        ? `${card.position.index}/${card.position.of}`
        : null;
      const allowed = card.id === "spotlight" ? spotlight : page;
      const missing = own
        .filter((s) => s !== position)
        .flatMap(tokens)
        .filter((t) => !allowed.has(t));
      expect(missing, `${card.id} on ${facts.month}`).toEqual([]);
      const source = tokens(card.source).filter((t) => !page.has(t));
      expect(source, `${card.id} source`).toEqual([]);
    }
  });
});
