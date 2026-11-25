import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import { monthSetCards, roundSetCards, type CardView } from "./cards";
import { listRecapMonths, loadRecap } from "./load-server";
import { altText, caption, hashtagsFor } from "./social-copy";
import type { RecapFacts } from "./types";

const oct = loadRecap("2026-10");

type Set = {
  name: string;
  kind: "round" | "month";
  cards: CardView[];
  facts: RecapFacts;
};

function setsOf(name: string, facts: RecapFacts): Set[] {
  return [
    ...Object.keys(facts.rounds).map((date): Set => ({
      name: `${name} round ${date}`,
      kind: "round",
      cards: roundSetCards(facts, date),
      facts,
    })),
    ...(facts.data
      ? [
          {
            name: `${name} month`,
            kind: "month" as const,
            cards: monthSetCards(facts),
            facts,
          },
        ]
      : []),
  ];
}

const SETS = [
  ...listRecapMonths().flatMap((m) => setsOf(m, loadRecap(m))),
  ...setsOf("round-only", roundOnly),
  ...setsOf("data-only", dataOnly),
  ...setsOf("two-rounds", twoRounds),
];

describe("hashtags", () => {
  it("follows the visas the cards show", () => {
    expect(hashtagsFor(roundSetCards(oct, "2026-10-15"))).toEqual([
      "#australiapr",
      "#skillselect",
      "#189visa",
    ]);
    expect(hashtagsFor(monthSetCards(oct))).toEqual([
      "#australiapr",
      "#skillselect",
      "#189visa",
      "#190visa",
      "#491visa",
    ]);
  });

  it("ends a month caption with the hashtag line", () => {
    expect(caption("month", monthSetCards(oct), oct).split("\n").at(-1)).toBe(
      "#australiapr #skillselect #189visa #190visa #491visa",
    );
  });
});

describe("caption", () => {
  it("links the recap, states the disclaimer and dates the round", () => {
    const text = caption("round", roundSetCards(oct, "2026-10-15"), oct);
    expect(text).toContain("migratelens.com/updates/2026-10/");
    expect(text).toContain("General information, not migration advice.");
    expect(text).toContain(
      "20,000 EOIs invited in the 189 round of 15 Oct 2026",
    );
  });
});

describe("every set's captions and alt text", () => {
  it("covers at least the October sets", () => {
    expect(SETS.length).toBeGreaterThan(2);
  });

  it.each(SETS.map((s) => [s.name, s] as const))(
    "%s passes the copy rules and keeps alt text short",
    (_name, set) => {
      const texts = [
        caption(set.kind, set.cards, set.facts),
        ...set.cards.map(altText),
      ];
      for (const text of texts) {
        expect(BANNED_COPY.test(text), text).toBe(false);
        expect(text).not.toMatch(/\bNaN\b|\bundefined\b|\bnull\b/);
        expect(text).not.toMatch(/\b(at least|about) 0\b/);
        expect(text).not.toMatch(/\bpeople\b/i);
        expect(text).not.toMatch(/next round/i);
      }
      for (const card of set.cards)
        expect(altText(card).length, card.id).toBeLessThanOrEqual(1000);
    },
  );

  it("spells out the state figures in alt text", () => {
    const card = monthSetCards(oct)[2];
    expect(altText(card)).toContain("NSW at least 790");
  });
});
