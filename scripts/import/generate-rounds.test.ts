import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RoundsFile } from "../../src/lib/data/rounds-file";
import { generate } from "./generate";
import {
  matchRounds,
  readRoundsFile,
  ROUND_NAME_ALIASES,
} from "./generate-rounds";
import {
  normalizeOccupationName,
  parseCurrentRound,
  parseRoundPages,
  type ParsedRound,
} from "./rounds";

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
          totals: null,
          tieBreak: null,
          rows: [
            {
              occupationName: "Psychologist (nec)",
              cutoff: 85,
              tieBreak: null,
            },
          ],
          nominations: null,
        },
      ],
      [{ code: "272399", name: "Psychologists nec" }],
    );
    expect(matched.unmatched).toEqual([]);
    expect(matched.cutoffs("272399")).toEqual([
      { date: "2024-06-13", cutoff: 85 },
    ]);
    expect(matched.file[0].rows).toEqual([
      {
        name: "Psychologist (nec)",
        code: "272399",
        cutoff: 85,
        tieBreak: null,
      },
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

describe("matchRounds v2 fields", () => {
  const nominations = parseCurrentRound(
    fixture("invitation-rounds.html"),
  ).nominations;
  const round: ParsedRound = {
    date: "2026-10-15",
    totals: [{ subclass: "189", label: "Skilled Independent", invited: 20000 }],
    tieBreak: null,
    rows: [
      { occupationName: "Actuary", cutoff: 85, tieBreak: "2026-09-03" },
      { occupationName: "Patho", cutoff: 90, tieBreak: null },
    ],
    nominations,
  };

  it("carries totals, tie-breaks and nominations into the stored round", () => {
    const matched = matchRounds([round], [{ code: "224111", name: "Actuary" }]);
    expect(matched.file).toEqual([
      {
        date: "2026-10-15",
        totals: round.totals,
        tieBreak: null,
        rows: [
          {
            name: "Actuary",
            code: "224111",
            cutoff: 85,
            tieBreak: "2026-09-03",
          },
          { name: "Patho", code: null, cutoff: 90, tieBreak: null },
        ],
        nominations,
      },
    ]);
  });

  it("keeps a stored match even when the name no longer matches", () => {
    const stored: ParsedRound = {
      ...round,
      rows: [
        {
          occupationName: "Actuary",
          cutoff: 85,
          tieBreak: null,
          code: "224111",
        },
        { occupationName: "Patho", cutoff: 90, tieBreak: null, code: null },
      ],
    };
    const matched = matchRounds([stored], [{ code: "999999", name: "Patho" }]);
    expect(matched.file[0].rows.map((row) => row.code)).toEqual([
      "224111",
      "999999", // an unmatched stored row is matched again
    ]);
    expect(matched.cutoffs("224111")).toEqual([
      { date: "2026-10-15", cutoff: 85 },
    ]);
    expect(matched.unmatched).toEqual([]);
  });
});

describe("readRoundsFile", () => {
  const stored: RoundsFile = {
    schemaVersion: 2,
    rounds: [
      {
        date: "2026-10-15",
        totals: [
          {
            subclass: "189",
            label: "Skilled Independent visa (subclass 189)",
            invited: 20000,
          },
        ],
        tieBreak: null,
        rows: [
          {
            name: "Software Engineer",
            code: "261313",
            cutoff: 95,
            tieBreak: "2026-09-03",
          },
          { name: "Chef", code: null, cutoff: 90, tieBreak: null },
        ],
        nominations: null,
      },
      {
        date: "2026-06-04",
        totals: null,
        tieBreak: "2026-04-24",
        rows: [],
        nominations: null,
      },
    ],
    skipped: [{ date: "2021-01-21", reason: "unit-group layout" }],
  };

  it("turns a stored rounds file back into parsed rounds and skipped rounds", () => {
    expect(readRoundsFile(stored)).toEqual({
      rounds: [
        {
          date: "2026-10-15",
          totals: stored.rounds[0].totals,
          tieBreak: null,
          rows: [
            {
              occupationName: "Software Engineer",
              cutoff: 95,
              tieBreak: "2026-09-03",
              code: "261313",
            },
            {
              occupationName: "Chef",
              cutoff: 90,
              tieBreak: null,
              code: null,
            },
          ],
          nominations: null,
        },
        {
          date: "2026-06-04",
          totals: null,
          tieBreak: "2026-04-24",
          rows: [],
          nominations: null,
        },
      ],
      skipped: [{ date: "2021-01-21", reason: "unit-group layout" }],
    });
  });

  it("round-trips every v2 field through matchRounds", () => {
    const pages = readRoundsFile(stored);
    expect(matchRounds(pages.rounds, []).file).toEqual(stored.rounds);
  });

  it("rejects the old files and malformed rows", () => {
    expect(() => readRoundsFile(stored.rounds)).toThrow(/rounds.json/);
    expect(() => readRoundsFile(undefined)).toThrow(/rounds.json/);
    const v1 = { rounds: [], skipped: [] };
    expect(() => readRoundsFile(v1)).toThrow(/schemaVersion 2/);
    const badCutoff = structuredClone(stored);
    (badCutoff.rounds[0].rows[0] as { cutoff: unknown }).cutoff = "95";
    expect(() => readRoundsFile(badCutoff)).toThrow(/rounds.json/);
    const badDate = structuredClone(stored);
    badDate.skipped[0].date = "21/01/2021";
    expect(() => readRoundsFile(badDate)).toThrow(/rounds.json/);
  });
});

describe("src/data/rounds.json", () => {
  // `npm run data:generate` without --rounds-html rebuilds rounds.json from
  // itself, so it must come back byte for byte (ruling R2).
  it("regenerates byte-identical from the stored file", () => {
    const text = readFileSync("src/data/rounds.json", "utf8");
    const manifest = JSON.parse(
      readFileSync("src/data/manifest.json", "utf8"),
    ) as { asAt: string; checkedAt: string };
    const data = generate({
      rawRoot: "data/raw",
      asAt: manifest.asAt,
      checkedAt: manifest.checkedAt,
      rounds: readRoundsFile(JSON.parse(text)),
      importVersion: "round-trip",
    });
    expect(JSON.stringify(data.rounds)).toBe(text);
  });
});
