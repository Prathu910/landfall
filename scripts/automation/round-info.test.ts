import { describe, expect, it } from "vitest";
import { parseRoundInfoArgs, roundInfoLines } from "./round-info";

describe("parseRoundInfoArgs", () => {
  it("reads the round date", () => {
    expect(parseRoundInfoArgs(["--round", "2026-10-15"])).toBe("2026-10-15");
  });

  it("rejects a missing or malformed date, and other flags", () => {
    expect(() => parseRoundInfoArgs([])).toThrow(/Usage/);
    expect(() => parseRoundInfoArgs(["--round"])).toThrow(/Usage/);
    expect(() => parseRoundInfoArgs(["--round", "2026-10"])).toThrow(/--round/);
    expect(() => parseRoundInfoArgs(["--month", "2026-10-15"])).toThrow(
      /Usage/,
    );
  });
});

describe("roundInfoLines", () => {
  it("names the round's month and day, and says whether main has its section", () => {
    expect(roundInfoLines("2026-10-15", true)).toEqual([
      "month=2026-10",
      "day=15 Oct 2026",
      "on_base=yes",
    ]);
    expect(roundInfoLines("2027-01-08", false)).toEqual([
      "month=2027-01",
      "day=8 Jan 2027",
      "on_base=no",
    ]);
  });
});
