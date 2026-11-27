import { describe, expect, it } from "vitest";
import type { RoundsFile, StoredRound } from "../data/rounds-file";
import {
  nominationCount,
  nominationText,
  stateNominations,
} from "./nominations";

const STATES = {
  ACT: "<5",
  NSW: "11",
  NT: "188",
  QLD: "7",
  SA: "0",
  TAS: "271",
  VIC: "0",
  WA: "17",
};

function round(
  date: string,
  nominations: StoredRound["nominations"],
): StoredRound {
  return { date, rows: [], nominations } as unknown as StoredRound;
}

const table = (to: string) => ({
  programYear: "2026-27",
  from: "2026-07-01",
  to,
  byVisa: { "190": STATES, "491": { ...STATES, NSW: "0" } },
});

describe("state nominations", () => {
  it('reads "<5" as 0 to 4 and digits as exact', () => {
    expect(nominationCount("<5")).toEqual({ min: 0, max: 4 });
    expect(nominationCount("0")).toEqual({ min: 0, max: 0 });
    expect(nominationCount("271")).toEqual({ min: 271, max: 271 });
    expect(() => nominationCount("n/a")).toThrow();
    expect(nominationText("<5")).toBe("fewer than 5");
    expect(nominationText("1018")).toBe("1,018");
  });

  it("takes the newest round with a table", () => {
    const rounds = {
      schemaVersion: 2,
      rounds: [
        round("2026-11-12", null),
        round("2026-10-15", table("2026-09-30")),
        round("2026-09-10", table("2026-08-31")),
      ],
      skipped: [],
    } as RoundsFile;
    const nsw = stateNominations(rounds, "NSW");
    expect(nsw?.roundDate).toBe("2026-10-15");
    expect(nsw?.to).toBe("2026-09-30");
    expect(nsw?.byVisa["190"]).toEqual({
      text: "11",
      count: { min: 11, max: 11 },
    });
    expect(nsw?.byVisa["491"].text).toBe("0");
  });

  it("is null when no round has a table", () => {
    const rounds = {
      schemaVersion: 2,
      rounds: [round("2026-11-12", null)],
      skipped: [],
    } as RoundsFile;
    expect(stateNominations(rounds, "NSW")).toBeNull();
  });
});
