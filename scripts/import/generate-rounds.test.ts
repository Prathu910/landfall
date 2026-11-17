import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  matchRounds,
  readRoundsFile,
  ROUND_NAME_ALIASES,
} from "./generate-rounds";
import { normalizeOccupationName, parseRoundPages } from "./rounds";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
const index = JSON.parse(
  readFileSync(
    new URL("../../src/data/occupation-index.json", import.meta.url),
    "utf8",
  ),
) as { code: string; name: string }[];

describe("matchRounds", () => {
  it("matches reviewed source name variants through the alias map", () => {
    const matched = matchRounds(
      [
        {
          date: "2024-06-13",
          rows: [{ occupationName: "Psychologist (nec)", cutoff: 85 }],
        },
      ],
      [{ code: "272399", name: "Psychologists nec" }],
    );
    expect(matched.unmatched).toEqual([]);
    expect(matched.cutoffs("272399")).toEqual([
      { date: "2024-06-13", cutoff: 85 },
    ]);
    expect(matched.file[0].rows).toEqual([
      { name: "Psychologist (nec)", code: "272399", cutoff: 85 },
    ]);
  });

  it("uses only aliases seen on the recorded round pages that name an indexed occupation", () => {
    const sourceNames = new Set(
      parseRoundPages(
        fixture("invitation-rounds.html"),
        fixture("previous-rounds.html"),
      ).flatMap((round) => round.rows.map((row) => row.occupationName)),
    );
    const indexNames = new Set(
      index.map((entry) => normalizeOccupationName(entry.name)),
    );
    expect(Object.keys(ROUND_NAME_ALIASES).length).toBeGreaterThan(0);
    for (const [source, target] of Object.entries(ROUND_NAME_ALIASES)) {
      expect(sourceNames.has(source)).toBe(true);
      expect(indexNames.has(normalizeOccupationName(source))).toBe(false);
      expect(indexNames.has(normalizeOccupationName(target))).toBe(true);
    }
  });
});

describe("readRoundsFile", () => {
  const stored = {
    rounds: [
      {
        date: "2026-10-15",
        rows: [
          { name: "Software Engineer", code: "261313", cutoff: 95 },
          { name: "Chef", code: null, cutoff: 90 },
        ],
      },
    ],
    skipped: [{ date: "2021-01-21", reason: "unit-group layout" }],
  };

  it("turns a stored rounds file back into parsed rounds and skipped rounds", () => {
    expect(readRoundsFile(stored)).toEqual({
      rounds: [
        {
          date: "2026-10-15",
          rows: [
            { occupationName: "Software Engineer", cutoff: 95 },
            { occupationName: "Chef", cutoff: 90 },
          ],
        },
      ],
      skipped: [{ date: "2021-01-21", reason: "unit-group layout" }],
    });
  });

  it("rejects the old bare-array file and malformed rows", () => {
    expect(() => readRoundsFile(stored.rounds)).toThrow(/rounds.json/);
    expect(() => readRoundsFile(undefined)).toThrow(/rounds.json/);
    const badCutoff = structuredClone(stored);
    (badCutoff.rounds[0].rows[0] as { cutoff: unknown }).cutoff = "95";
    expect(() => readRoundsFile(badCutoff)).toThrow(/rounds.json/);
    const badDate = structuredClone(stored);
    badDate.skipped[0].date = "21/01/2021";
    expect(() => readRoundsFile(badDate)).toThrow(/rounds.json/);
  });
});
