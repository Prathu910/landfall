import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { RoundsFile } from "../../src/lib/data/rounds-file";
import {
  detectRound,
  detectionLines,
  readCurrentRoundsPage,
} from "./detect-round";

const FIXTURES = new URL("../import/__fixtures__/", import.meta.url).pathname;
const current = readFileSync(`${FIXTURES}invitation-rounds.html`, "utf8");

const storedRound = (date: string) => ({
  date,
  totals: null,
  tieBreak: null,
  rows: [],
  nominations: null,
});
const stored = (...dates: string[]): RoundsFile => ({
  schemaVersion: 2,
  rounds: dates.map(storedRound),
  skipped: [],
});

describe("detectRound", () => {
  it("says new when the current page's round is newer than every stored round", () => {
    expect(detectRound(stored("2026-06-04", "2025-11-13"), current)).toBe(
      "new",
    );
    expect(detectRound(stored(), current)).toBe("new");
  });

  it("says none when the current round is already stored", () => {
    expect(detectRound(stored("2026-10-15", "2026-06-04"), current)).toBe(
      "none",
    );
  });

  it("rejects a rounds file that isn't v2", () => {
    expect(() => detectRound({ rounds: [] }, current)).toThrow(
      /schemaVersion 2/,
    );
  });
});

describe("detectionLines", () => {
  it("prints the status and the current page's round date, which names the branch", () => {
    expect(detectionLines(stored("2026-06-04"), current)).toEqual([
      "status=new",
      "newest=2026-10-15",
    ]);
    expect(detectionLines(stored("2026-10-15"), current)).toEqual([
      "status=none",
      "newest=2026-10-15",
    ]);
  });
});

describe("readCurrentRoundsPage", () => {
  it("reads invitation-rounds.html from the given folder instead of fetching", async () => {
    expect(await readCurrentRoundsPage(FIXTURES)).toBe(current);
  });
});
