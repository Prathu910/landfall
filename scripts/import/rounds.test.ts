// Fixtures captured 2026-11-17 from the live SkillSelect pages, trimmed to the
// PageSchemaHiddenField input the parser reads.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeOccupationName,
  parseRoundBlock,
  parseRoundPages,
  parseRoundPagesDetailed,
} from "./rounds";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
const current = fixture("invitation-rounds.html");
const previous = fixture("previous-rounds.html");

describe("parseRoundPages", () => {
  const rounds = parseRoundPages(current, previous);
  const dates = rounds.map((r) => r.date);

  it("includes current and previous rounds, newest first", () => {
    for (const d of [
      "2026-10-15",
      "2026-06-04",
      "2025-11-13",
      "2025-08-21",
      "2024-11-07",
      "2024-09-05",
      "2023-12-18",
    ]) {
      expect(dates).toContain(d);
    }
    expect(dates).toEqual([...dates].sort().reverse());
    expect(rounds.length).toBeGreaterThan(5);
  });

  it("keeps every occupation row", () => {
    const round = rounds.find((r) => r.date === "2024-11-07");
    const row = round?.rows.find(
      (r) => normalizeOccupationName(r.occupationName) === "ictbusinessanalyst",
    );
    expect(row?.cutoff).toBe(95);
  });

  it("throws on a non-integer cut-off", () => {
    const bad = current.replace(/(Actuary.*?\\u003cp\\u003e)85/s, "$195+");
    expect(bad).not.toBe(current);
    expect(() => parseRoundPages(bad, previous)).toThrow();
  });
});

describe("parseRoundPagesDetailed", () => {
  const { rounds, skipped } = parseRoundPagesDetailed(current, previous);

  it("parses the blank-first-header 2022-23 layouts", () => {
    for (const date of ["2023-05-25", "2022-12-08", "2022-08-22"]) {
      const round = rounds.find((r) => r.date === date);
      expect(round?.rows.length).toBeGreaterThan(0);
      for (const row of round?.rows ?? []) {
        expect(Number.isInteger(row.cutoff)).toBe(true);
      }
    }
    const audiologist = rounds
      .find((r) => r.date === "2023-05-25")
      ?.rows.find((r) => r.occupationName === "Audiologist");
    expect(audiologist?.cutoff).toBe(65);
  });

  it("reports unparseable rounds instead of dropping them", () => {
    expect(skipped.length).toBeGreaterThan(0);
    for (const s of skipped) expect(s.reason.length).toBeGreaterThan(0);
    const parsed = new Set(rounds.map((r) => r.date));
    for (const s of skipped) expect(parsed.has(s.date)).toBe(false);
    expect(rounds.length + skipped.length).toBe(21);
  });

  it("skips the unit-group layout (Subclass | Occupation ID) with a reason", () => {
    const unitGroupRounds = [
      "2021-10-29",
      "2021-07-26",
      "2021-04-21",
      "2021-01-21",
      "2020-10-21",
      "2020-09-11",
      "2020-08-11",
    ];
    for (const date of unitGroupRounds) {
      expect(skipped.find((s) => s.date === date)?.reason).toMatch(
        /Occupation ID/,
      );
    }
    expect(skipped.map((s) => s.date).sort()).toEqual(
      [...unitGroupRounds, "2022-10-06"].sort(),
    );
  });

  it("never reads a 4-digit unit group or a 491 cell as a 189 cut-off", () => {
    for (const round of rounds) {
      for (const row of round.rows) {
        expect(row.occupationName).not.toMatch(/^\d+$/);
      }
    }
  });
});

describe("parseRoundBlock", () => {
  const table = (...rows: string[]) =>
    `<table>${rows.map((row) => `<tr>${row}</tr>`).join("")}</table>`;
  const visa189Only = table(
    "<th>Visa subclass</th><th>Total EOIs Invited</th>",
    "<td>Skilled Independent visa (subclass 189)</td><td>100</td>",
  );

  it("requires an explicit 189 column", () => {
    const block = table(
      "<th>Occupation</th><th>Subclass 189/491</th>",
      "<td>Actuary</td><td>85</td>",
    );
    expect(() => parseRoundBlock("2026-01-01", block)).toThrow(/189 column/);
  });

  it("reads Minimum points score only when the round lists 189 alone", () => {
    const occupations = table(
      "<th>Occupation*</th><th>Minimum points score</th>",
      "<td>Actuary</td><td>85</td>",
    );
    expect(parseRoundBlock("2026-01-01", visa189Only + occupations)).toEqual({
      round: {
        date: "2026-01-01",
        rows: [{ occupationName: "Actuary", cutoff: 85 }],
      },
    });
    expect(() => parseRoundBlock("2026-01-01", occupations)).toThrow(
      /189 column/,
    );
  });

  it("maps two-row group headers by colspan", () => {
    const block = table(
      '<th></th><th>189</th><th colspan="3">491</th>',
      "<th>Occupation</th><th>All</th><th>Offshore</th><th>Onshore</th><th>Other</th>",
      "<td>Actuary</td><td>90</td><td>65</td><td>60</td><td>70</td>",
    );
    expect(parseRoundBlock("2026-01-01", block)).toEqual({
      round: {
        date: "2026-01-01",
        rows: [{ occupationName: "Actuary", cutoff: 90 }],
      },
    });
  });

  it("throws when the group header spans a different number of columns", () => {
    const block = table(
      '<th></th><th colspan="2">189</th><th colspan="3">491</th>',
      "<th>Occupation</th><th>Offshore</th><th>Onshore</th><th>Offshore</th><th>Onshore</th>",
      "<td>Actuary</td><td>90</td><td>95</td><td>65</td><td>60</td>",
    );
    expect(() => parseRoundBlock("2026-01-01", block)).toThrow(/spans 6/);
  });
});

describe("normalizeOccupationName", () => {
  it("keeps lowercase alphanumerics only", () => {
    expect(normalizeOccupationName("ICT Business Analyst (261111)")).toBe(
      "ictbusinessanalyst261111",
    );
  });
});
