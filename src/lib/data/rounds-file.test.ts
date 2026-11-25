import { describe, expect, it } from "vitest";
import { isRoundsFile, type RoundsFile } from "./rounds-file";

const states = (value: string) => ({
  ACT: value,
  NSW: value,
  NT: value,
  QLD: value,
  SA: value,
  TAS: value,
  VIC: value,
  WA: value,
});

function file(): RoundsFile {
  return {
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
            name: "Actuary",
            code: "224111",
            cutoff: 85,
            tieBreak: "2026-09-03",
          },
          { name: "Patho", code: null, cutoff: 90, tieBreak: null },
        ],
        nominations: {
          programYear: "2026-27",
          from: "2026-07-01",
          to: "2026-09-30",
          byVisa: { "190": states("<5"), "491": states("0") },
        },
      },
      {
        date: "2023-12-18",
        totals: null,
        tieBreak: null,
        rows: [],
        nominations: null,
      },
    ],
    skipped: [{ date: "2021-01-21", reason: "unit-group layout" }],
  };
}

type Mutable = Record<string, unknown> & {
  rounds: Record<string, unknown>[];
};
const mutated = (change: (value: Mutable) => void): unknown => {
  const value = structuredClone(file()) as unknown as Mutable;
  change(value);
  return value;
};

describe("isRoundsFile", () => {
  it("accepts a v2 file, with or without totals and nominations", () => {
    expect(isRoundsFile(file())).toBe(true);
  });

  it("rejects a rounds file without schemaVersion 2", () => {
    expect(isRoundsFile(mutated((v) => delete v.schemaVersion))).toBe(false);
    expect(isRoundsFile(mutated((v) => (v.schemaVersion = 1)))).toBe(false);
  });

  it("rejects a round missing a v2 field", () => {
    for (const key of ["totals", "tieBreak", "nominations"]) {
      expect(isRoundsFile(mutated((v) => delete v.rounds[0][key])), key).toBe(
        false,
      );
    }
    const noRowTieBreak = mutated((v) => {
      delete (v.rounds[0].rows as Record<string, unknown>[])[0].tieBreak;
    });
    expect(isRoundsFile(noRowTieBreak)).toBe(false);
  });

  it("rejects malformed totals, dates and nomination tables", () => {
    const badInvited = mutated((v) => {
      (v.rounds[0].totals as Record<string, unknown>[])[0].invited = "20,000";
    });
    expect(isRoundsFile(badInvited)).toBe(false);
    const badTieBreak = mutated((v) => (v.rounds[0].tieBreak = "03/09/2026"));
    expect(isRoundsFile(badTieBreak)).toBe(false);
    const missingState = mutated((v) => {
      const table = v.rounds[0].nominations as {
        byVisa: Record<string, Record<string, string>>;
      };
      delete table.byVisa["190"].WA;
    });
    expect(isRoundsFile(missingState)).toBe(false);
  });
});
