import { describe, expect, it } from "vitest";
import { isRecapFacts } from "./guards";

const section = {
  generatedAt: "2026-10-16",
  sources: {},
  totals: [],
  occupations: [],
  distribution: [],
  previousRound: null,
  comparison: null,
  cardPicks: [],
};
const file = (rounds: Record<string, unknown>) => ({
  schemaVersion: 1,
  month: "2026-10",
  firstGeneratedAt: "2026-10-16",
  updatedAt: "2026-10-16",
  rounds,
  data: null,
});

describe("isRecapFacts", () => {
  it("accepts a round-only file", () => {
    expect(isRecapFacts(file({ "2026-10-15": section }))).toBe(true);
  });
  it("rejects a facts file whose round key isn't in its month", () => {
    expect(isRecapFacts(file({ "2026-11-15": section }))).toBe(false);
  });
  it("rejects a bad version, a bad section and null input", () => {
    expect(isRecapFacts({ ...file({}), schemaVersion: 2 })).toBe(false);
    expect(
      isRecapFacts(file({ "2026-10-15": { ...section, totals: null } })),
    ).toBe(false);
    expect(isRecapFacts(null)).toBe(false);
  });
});
