import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  changedFrozenSections,
  hasPublishedData,
  hasPublishedRound,
} from "./frozen";
import { isRecapFacts } from "./guards";
import type { RecapFacts } from "./types";

const parsed: unknown = JSON.parse(
  readFileSync("src/data/updates/2026-10.json", "utf8"),
);
if (!isRecapFacts(parsed)) throw new Error("2026-10.json is not recap facts");
const oct: RecapFacts = parsed;
const roundDate = Object.keys(oct.rounds)[0];

function withoutRound(facts: RecapFacts, date: string): RecapFacts {
  const rounds = { ...facts.rounds };
  delete rounds[date];
  return { ...facts, rounds };
}

describe("changedFrozenSections", () => {
  it("ignores header fields and key order", () => {
    expect(
      changedFrozenSections(oct, { ...oct, updatedAt: "2026-12-15" }),
    ).toEqual([]);
    const reordered = JSON.parse(JSON.stringify(oct)) as RecapFacts;
    reordered.rounds = Object.fromEntries(
      Object.entries(reordered.rounds).map(([d, s]) => [
        d,
        Object.fromEntries(Object.entries(s).reverse()) as typeof s,
      ]),
    );
    expect(changedFrozenSections(oct, reordered)).toEqual([]);
  });

  it("reports a changed data section", () => {
    const head = JSON.parse(JSON.stringify(oct)) as RecapFacts;
    (head.data as unknown as Record<string, unknown>).movers = {
      fell: [],
      rose: [],
    };
    expect(changedFrozenSections(oct, head)).toEqual(["data"]);
  });

  it("reports a dropped data section", () => {
    expect(changedFrozenSections(oct, { ...oct, data: null })).toEqual([
      "data",
    ]);
  });

  it("reports a missing or changed round", () => {
    expect(changedFrozenSections(oct, withoutRound(oct, roundDate))).toEqual([
      `rounds[${roundDate}]`,
    ]);
    const head = JSON.parse(JSON.stringify(oct)) as RecapFacts;
    (head.rounds[roundDate] as unknown as Record<string, unknown>).extra = 1;
    expect(changedFrozenSections(oct, head)).toEqual([`rounds[${roundDate}]`]);
  });

  it("allows new sections and a new month", () => {
    expect(changedFrozenSections(null, oct)).toEqual([]);
    expect(changedFrozenSections(withoutRound(oct, roundDate), oct)).toEqual(
      [],
    );
    expect(changedFrozenSections({ ...oct, data: null }, oct)).toEqual([]);
  });
});

describe("published checks", () => {
  it("reads what main already holds", () => {
    expect(hasPublishedData(oct)).toBe(oct.data !== null);
    expect(hasPublishedData(null)).toBe(false);
    expect(hasPublishedRound(oct, roundDate)).toBe(true);
    expect(hasPublishedRound(oct, "2026-10-01")).toBe(false);
    expect(hasPublishedRound(null, roundDate)).toBe(false);
  });
});
