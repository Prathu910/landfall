// Fixtures captured 2026-11-17 from the live SkillSelect pages, trimmed to the
// PageSchemaHiddenField input the parser reads.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeOccupationName,
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
});

describe("normalizeOccupationName", () => {
  it("keeps lowercase alphanumerics only", () => {
    expect(normalizeOccupationName("ICT Business Analyst (261111)")).toBe(
      "ictbusinessanalyst261111",
    );
  });
});
