import { describe, expect, it } from "vitest";
import { isRecapFacts } from "./guards";
import { withDataSection, withRoundSection } from "./merge";
import type { DataSection, RoundSection } from "./types";

const round = {
  generatedAt: "2026-10-16",
  sources: { currentRounds: "a", previousRounds: "b", checkedAt: "2026-10-16" },
  totals: [],
  occupations: [],
  distribution: [],
  previousRound: null,
  comparison: null,
  cardPicks: [],
} as RoundSection;

const data = {
  generatedAt: "2026-11-20",
  sources: {},
  national: {},
  pool189ByScore: [],
  invitedByScore: {},
  states: {},
  nominations: null,
  movers: {},
  notable189: null,
  largePoolsNotListed: [],
  spotlight: {},
  occupationsAdded: null,
  occupationsRemoved: null,
} as unknown as DataSection;

describe("merge", () => {
  it("adds a round section without touching data or firstGeneratedAt", () => {
    const a = withDataSection(null, "2026-10", data, "2026-11-20");
    const b = withRoundSection(a, "2026-10", "2026-10-15", round, "2026-11-25");
    expect(b.firstGeneratedAt).toBe("2026-11-20");
    expect(b.updatedAt).toBe("2026-11-25");
    expect(b.data).toBe(data);
    expect(b.rounds["2026-10-15"]).toBe(round);
  });
  it("keeps two rounds keyed by date and leaves the earlier one alone", () => {
    const a = withRoundSection(
      null,
      "2026-10",
      "2026-10-01",
      round,
      "2026-10-02",
    );
    const r2 = { ...round, generatedAt: "2026-10-16" };
    const b = withRoundSection(a, "2026-10", "2026-10-15", r2, "2026-10-16");
    expect(Object.keys(b.rounds)).toEqual(["2026-10-01", "2026-10-15"]);
    expect(b.rounds["2026-10-01"]).toBe(round);
    expect(b.data).toBeNull();
  });
  it("adds data without touching rounds", () => {
    const a = withRoundSection(
      null,
      "2026-10",
      "2026-10-15",
      round,
      "2026-10-16",
    );
    const b = withDataSection(a, "2026-10", data, "2026-11-20");
    expect(b.rounds).toBe(a.rounds);
    expect(b.firstGeneratedAt).toBe("2026-10-16");
  });
  it("refuses a round outside the month or a file for another month", () => {
    expect(() =>
      withRoundSection(null, "2026-10", "2026-11-15", round, "2026-11-16"),
    ).toThrow();
    const a = withDataSection(null, "2026-10", data, "2026-11-20");
    expect(() => withDataSection(a, "2026-09", data, "2026-11-20")).toThrow();
  });
  it("produces files the guard accepts", () => {
    const a = withRoundSection(
      null,
      "2026-10",
      "2026-10-15",
      round,
      "2026-10-16",
    );
    expect(
      isRecapFacts(withDataSection(a, "2026-10", data, "2026-11-20")),
    ).toBe(true);
  });
});
