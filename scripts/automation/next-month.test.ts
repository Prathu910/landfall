import { describe, expect, it } from "vitest";
import { nextImportMonth, parseNextMonthArgs } from "./next-month";

describe("nextImportMonth", () => {
  it("does nothing when the snapshot is already the newest", () => {
    expect(nextImportMonth("2026-10", "2026-10", null)).toBeNull();
  });

  it("takes the oldest missing month, never the newest", () => {
    expect(nextImportMonth("2026-10", "2026-12", null)).toBe("2026-11");
    expect(nextImportMonth("2026-12", "2027-01", null)).toBe("2027-01");
  });

  it("returns the requested month, even a rehearsal of the current one", () => {
    expect(nextImportMonth("2026-10", "2026-10", "2026-10")).toBe("2026-10");
  });
});

describe("parseNextMonthArgs", () => {
  it("reads both flags", () => {
    expect(
      parseNextMonthArgs(["--newest", "2026-11", "--requested", "2026-10"]),
    ).toEqual({ newest: "2026-11", requested: "2026-10" });
    expect(parseNextMonthArgs(["--newest", "2026-11"]).requested).toBeNull();
  });

  it("rejects a missing or malformed month", () => {
    expect(() => parseNextMonthArgs([])).toThrow(/--newest/);
    expect(() => parseNextMonthArgs(["--newest", "2026-13"])).toThrow();
    expect(() =>
      parseNextMonthArgs(["--newest", "2026-11", "--requested", "x"]),
    ).toThrow(/--requested/);
  });
});
