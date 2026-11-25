import { describe, expect, it } from "vitest";
import { coverageFor, parseSummaryArgs, warningLines } from "./summary";

const ok = [
  "--month",
  "2026-10",
  "--kind",
  "data",
  "--import-report",
  "r.json",
  "--branch",
  "data/2026-10",
];

describe("parseSummaryArgs", () => {
  it("parses a data update", () => {
    expect(parseSummaryArgs([...ok, "--today", "2026-11-17"])).toMatchObject({
      month: "2026-10",
      kind: "data",
      round: null,
      appendTo: null,
      today: "2026-11-17",
    });
  });
  it("needs a round for a round update and rejects one for data", () => {
    expect(() =>
      parseSummaryArgs([
        "--month",
        "2026-10",
        "--kind",
        "round",
        "--import-report",
        "r",
        "--branch",
        "b",
      ]),
    ).toThrow(/--round/);
    expect(() => parseSummaryArgs([...ok, "--round", "2026-10-15"])).toThrow(
      /--kind round/,
    );
  });
  it("rejects unknown flags, repeats and a missing report", () => {
    expect(() => parseSummaryArgs([...ok, "--nope", "x"])).toThrow(
      /Unknown flag/,
    );
    expect(() => parseSummaryArgs([...ok, "--branch", "x"])).toThrow(/twice/);
    expect(() =>
      parseSummaryArgs([
        "--month",
        "2026-10",
        "--kind",
        "data",
        "--branch",
        "b",
      ]),
    ).toThrow(/--import-report/);
  });
});

describe("warningLines", () => {
  it("keeps WARNING lines without the label", () => {
    expect(
      warningLines("ok\nWARNING: visa fees older than 1 July\nbuilt"),
    ).toEqual(["visa fees older than 1 July"]);
  });
});

describe("coverageFor", () => {
  it("sums Software Engineer's 189 statuses for 2026-10 and 2026-09", () => {
    const c = coverageFor("2026-10");
    expect(c?.current).toEqual({ min: 22280, max: 22299 });
    expect(c?.previous?.min).toBeLessThan(22280);
  });
});
