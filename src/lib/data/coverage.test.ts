import { describe, expect, it } from "vitest";
import { frozenIndex } from "./__fixtures__/frozen-2026-10";
import { coverageSentence, snapshotCoverage } from "./coverage";

describe("snapshotCoverage", () => {
  it("counts every occupation and those with published data", () => {
    const entries = [
      { code: "1", name: "A", hasData: true },
      { code: "2", name: "B", hasData: false },
      { code: "3", name: "C", hasData: true },
    ];
    expect(snapshotCoverage(entries)).toEqual({ total: 3, withData: 2 });
  });

  it("matches the frozen 2026-10 snapshot (493 occupations, 479 with data)", () => {
    expect(snapshotCoverage(frozenIndex())).toEqual({
      total: 493,
      withData: 479,
    });
  });
});

describe("coverageSentence", () => {
  it("states both counts, with thousands separators", () => {
    expect(coverageSentence({ total: 1493, withData: 479 })).toBe(
      "The current occupation import covers 1,493 occupations, 479 of them with published SkillSelect data;",
    );
  });
});
