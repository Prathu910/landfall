import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { StoredRound, RoundsFile } from "../data/rounds-file";
import { buildRoundSection, previousRound } from "./facts-round";

const file = JSON.parse(
  readFileSync(
    path.resolve(__dirname, "__fixtures__/rounds-2026-10.json"),
    "utf8",
  ),
) as RoundsFile;
const [oct, jun] = file.rounds;
const sources = {
  currentRounds: "a",
  previousRounds: "b",
  checkedAt: "2026-10-16",
};
const base = { names: new Map<string, string>(), sources, today: "2026-10-16" };

const row = (name: string, code: string | null, cutoff: number) => ({
  name,
  code,
  cutoff,
  tieBreak: null,
});
const round = (date: string, rows: StoredRound["rows"]): StoredRound => ({
  date,
  totals: [{ subclass: "189", label: "Skilled Independent", invited: 100 }],
  tieBreak: null,
  rows,
  nominations: null,
});

describe("buildRoundSection, 2026-10", () => {
  const s = buildRoundSection({ ...base, round: oct, previous: jun });
  it("matches the published round", () => {
    expect(s.occupations).toHaveLength(159);
    expect(s.distribution).toEqual(
      [
        [65, 44],
        [70, 36],
        [75, 9],
        [80, 36],
        [85, 19],
        [90, 10],
        [95, 3],
        [100, 2],
      ].map(([score, occupations]) => ({ score, occupations })),
    );
    expect(s.comparison).toMatchObject({ fell: 78, rose: 9, same: 50 });
    expect(s.comparison!.newlyListed).toHaveLength(22);
    expect(s.comparison!.notListedAgain.map((o) => o.name)).toEqual([
      "Fitter and Turner",
      "Organisational Psychologist",
      "Thoracic Medicine Specialist",
    ]);
    expect(s.cardPicks.map((m) => m.code)).toEqual([
      "134214",
      "342111",
      "272311",
    ]);
    expect(s.totals[0].invited).toBe(20000);
    expect(s.previousRound).toEqual({ date: "2026-06-04", listed: 140 });
    expect(s.comparison!.falls).toHaveLength(6);
  });
  it("finds the next older round", () => {
    expect(previousRound(file, "2026-10-15")?.date).toBe("2026-06-04");
    expect(previousRound(file, "2026-06-04")).toBeNull();
  });
});

describe("buildRoundSection, fixtures", () => {
  it("collapses duplicate codes to the lowest cut-off", () => {
    const s = buildRoundSection({
      ...base,
      round: round("2026-10-15", [row("A", "1", 90), row("A2", "1", 80)]),
      previous: null,
    });
    expect(s.occupations).toHaveLength(1);
    expect(s.occupations[0].cutoff).toBe(80);
  });
  it("counts an unmatched name as listed but never picks it", () => {
    const s = buildRoundSection({
      ...base,
      round: round("2026-10-15", [row("X", null, 65), row("B", "2", 70)]),
      previous: round("2026-06-04", [row("X", null, 90), row("B", "2", 70)]),
    });
    expect(s.occupations).toHaveLength(2);
    expect(s.comparison).toMatchObject({ fell: 1, same: 1 });
    expect(s.cardPicks).toEqual([]);
  });
  it("gives no comparison when there is no previous parsed round", () => {
    const s = buildRoundSection({
      ...base,
      round: round("2026-10-15", [row("B", "2", 70)]),
      previous: null,
    });
    expect(s.comparison).toBeNull();
    expect(s.previousRound).toBeNull();
    expect(s.cardPicks).toEqual([]);
  });
  it("takes the three largest moves when only one kind exists", () => {
    const s = buildRoundSection({
      ...base,
      round: round("d", [
        row("A", "1", 80),
        row("B", "2", 70),
        row("C", "3", 60),
        row("D", "4", 65),
      ]),
      previous: round("c", [
        row("A", "1", 90),
        row("B", "2", 75),
        row("C", "3", 70),
        row("D", "4", 66),
      ]),
    });
    expect(s.cardPicks.map((m) => m.code)).toEqual(["1", "3", "2"]);
  });
  it("throws when the round has no totals", () => {
    expect(() =>
      buildRoundSection({
        ...base,
        round: { ...round("2026-10-15", []), totals: null },
        previous: null,
      }),
    ).toThrow("Round totals missing");
  });
});
