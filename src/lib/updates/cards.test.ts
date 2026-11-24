import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import {
  cardStrings,
  monthSetCards,
  roundSetCards,
  type CardView,
} from "./cards";
import { loadRecap } from "./load-server";
import type { RecapFacts } from "./types";

const oct = loadRecap("2026-10");
const positions = (cards: CardView[]) =>
  cards.map((c) => c.position && `${c.position.index}/${c.position.of}`);

function noRound(facts: RecapFacts): RecapFacts {
  return { ...facts, rounds: {} };
}

describe("month set, October 2026", () => {
  const month = monthSetCards(oct);

  it("is cover, round, two state cards, spotlight and closing", () => {
    expect(month.map((c) => c.id)).toEqual([
      "cover",
      "round",
      "state-190",
      "state-491",
      "spotlight",
      "closing",
    ]);
    expect(positions(month)).toEqual(["1/6", null, "3/6", "4/6", "5/6", "6/6"]);
    expect(month.every((c) => c.tag === "Oct 2026")).toBe(true);
  });

  it("builds card 2 from the round facts", () => {
    const round = month[1] as Extract<CardView, { id: "round" }>;
    expect(round.total).toBe("20,000");
    expect(round.picks?.items.map((p) => p.name)).toEqual([
      "Welfare Centre Manager",
      "Airconditioning and Refrigeration Mechanic",
      "Clinical Psychologist",
    ]);
    expect(round.notListed).toMatch(/^Listed on .*, not this round \(3\): /);
    expect(round.visas).toEqual(["189"]);
  });

  it("reads an all-masked state as under 20, never 0", () => {
    const tas = (month[3] as Extract<CardView, { id: "state-491" }>).map.TAS;
    expect(tas).toEqual({ big: "<20", small: "each occupation", shade: 1 });
    const card = month[3] as Extract<CardView, { id: "state-491" }>;
    expect(cardStrings(card).join(" ")).not.toMatch(/\b(at least|about) 0\b/);
  });

  it("says the state is not recorded as a minimum", () => {
    expect(
      (month[2] as Extract<CardView, { id: "state-190" }>).notRecorded,
    ).toBe("State not recorded: at least 243");
  });

  it("closes with the call to action and the disclaimer", () => {
    expect(cardStrings(month[5])).toEqual(
      expect.arrayContaining([
        "Check your points free",
        "migratelens.com",
        "@migratelens",
        "General information, not migration advice.",
      ]),
    );
  });

  it("shows 189 figures on the spotlight and every visa on the cover", () => {
    expect(month[4].visas).toContain("189");
    expect(month[0].visas).toEqual(["189", "190", "491"]);
  });

  it("passes the banned-copy sweep", () => {
    const bad = month.flatMap(cardStrings).filter((s) => BANNED_COPY.test(s));
    expect(bad).toEqual([]);
  });
});

describe("round set", () => {
  it("is round cover, round and closing", () => {
    const cards = roundSetCards(oct, "2026-10-15");
    expect(cards.map((c) => c.id)).toEqual(["round-cover", "round", "closing"]);
    expect(positions(cards)).toEqual(["1/3", null, "3/3"]);
    expect(cards.flatMap((c) => c.visas)).toEqual(["189", "189"]);
  });

  it("reuses the identical round card in the month set", () => {
    expect(roundSetCards(oct, "2026-10-15")[1]).toEqual(monthSetCards(oct)[1]);
  });

  it("builds from a round-only month and rejects an unknown round", () => {
    expect(roundSetCards(roundOnly, "2026-11-19")).toHaveLength(3);
    expect(() => roundSetCards(oct, "2026-10-16")).toThrow();
  });

  it("handles one pick and a round without a comparison", () => {
    const round = roundSetCards(roundOnly, "2026-11-19")[1] as Extract<
      CardView,
      { id: "round" }
    >;
    expect(round.picks?.items).toHaveLength(1);
    const section = roundOnly.rounds["2026-11-19"];
    const first: RecapFacts = {
      ...roundOnly,
      rounds: {
        "2026-11-19": {
          ...section,
          previousRound: null,
          comparison: null,
          cardPicks: [],
        },
      },
    };
    const bare = roundSetCards(first, "2026-11-19")[1] as Extract<
      CardView,
      { id: "round" }
    >;
    expect(bare.picks).toBeNull();
    expect(bare.notListed).toBeNull();
  });
});

describe("a month without a round", () => {
  it("drops card 2 and the cover's round stamp", () => {
    const cards = monthSetCards(dataOnly);
    expect(cards.map((c) => c.id)).toEqual([
      "cover",
      "state-190",
      "state-491",
      "spotlight",
      "closing",
    ]);
    expect(positions(cards)).toEqual(["1/5", "2/5", "3/5", "4/5", "5/5"]);
    const cover = cards[0] as Extract<CardView, { id: "cover" }>;
    expect(cover.stamps.round).toBeNull();
    expect(cover.visas).toEqual(["190", "491"]);
    expect(cover.sub).toMatch(/^190 and 491 by state/);
  });

  it("carries no 189 unless the spotlight shows 189 figures", () => {
    const cards = monthSetCards(noRound(oct));
    expect(cards[0].visas).not.toContain("189");
    expect(cards.some((c) => c.id === "round")).toBe(false);
  });

  it("refuses a month set without the data section", () => {
    expect(() => monthSetCards(roundOnly)).toThrow();
  });
});

describe("two rounds in a month", () => {
  it("uses the newest round for card 2 and the cover", () => {
    const cards = monthSetCards(twoRounds);
    const [newest] = Object.keys(twoRounds.rounds).sort().reverse();
    const round = cards.find((c) => c.id === "round") as Extract<
      CardView,
      { id: "round" }
    >;
    expect(round).toEqual(roundSetCards(twoRounds, newest)[1]);
    expect(positions(cards)[0]).toBe("1/6");
  });
});

describe("the spotlight card", () => {
  it("lists six rounds oldest first with the latest cut-off", () => {
    const card = monthSetCards(oct)[4] as Extract<
      CardView,
      { id: "spotlight" }
    >;
    expect(card.name).toBe("Registered Nurses nec");
    expect(card.code).toBe("ANZSCO 254499");
    expect(card.stamp).toEqual({
      top: "189 · 15 OCT 2026",
      word: "70 PTS",
      bottom: "LOWEST INVITED",
    });
    expect(card.rounds.heading).toBe("Last six 189 rounds");
    expect(card.rounds.columns.map((c) => c.value)).toEqual([
      "75",
      "70",
      "80",
      "75",
      "75",
      "70",
    ]);
    expect(card.facts.map((f) => f.big)).toEqual(["2,730+", "4,280"]);
    expect(card.littleChanged).toBeNull();
  });

  it("says when little changed or 189 isn't available", () => {
    const data = oct.data!;
    const spot = data.spotlight;
    const quiet: RecapFacts = {
      ...oct,
      data: {
        ...data,
        spotlight: {
          ...spot,
          qualifiedBy: null,
          card: {
            ...spot.card,
            latest189: { kind: "not-on-list" },
            tieBreak: null,
            top190: [],
          },
        },
      },
    };
    const card = monthSetCards(quiet)[4] as Extract<
      CardView,
      { id: "spotlight" }
    >;
    expect(card.stamp).toBeNull();
    expect(card.unavailable).toBe("189 isn't available for this occupation");
    expect(card.littleChanged).toBe("Little changed this month.");
    expect(card.states190).toBeNull();
    expect(card.visas).toEqual(["189"]);
  });
});
