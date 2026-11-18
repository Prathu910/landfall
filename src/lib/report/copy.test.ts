import { describe, expect, it } from "vitest";
import {
  BANNED_COPY,
  countPhrase,
  formatCount,
  formatMonth,
  submissionMonth,
} from "./copy";

describe("formatCount", () => {
  it("writes a masked count as under 20", () => {
    expect(formatCount({ min: 0, max: 19 })).toBe("under 20");
  });
  it("groups single numbers", () => {
    expect(formatCount({ min: 1132, max: 1132 })).toBe("1,132");
  });
  it("writes ranges with an en dash", () => {
    expect(formatCount({ min: 872, max: 891 })).toBe("872–891");
  });
});

describe("countPhrase", () => {
  it("says a masked count may be zero", () => {
    expect(countPhrase({ min: 0, max: 19 })).toBe("under 20, so may be zero");
  });
  it("matches formatCount otherwise", () => {
    expect(countPhrase({ min: 1132, max: 1132 })).toBe("1,132");
  });
});

describe("formatMonth", () => {
  it("prints a short month and year", () => {
    expect(formatMonth("2026-10")).toBe("Oct 2026");
  });
});

describe("submissionMonth", () => {
  it("takes the month from a valid date", () => {
    expect(submissionMonth("2025-02-14")).toBe("2025-02");
  });
  it("returns null for empty or invalid dates", () => {
    expect(submissionMonth("")).toBeNull();
    expect(submissionMonth("2025-13-01")).toBeNull();
    expect(submissionMonth("2025-02-30")).toBeNull();
  });
});

describe("BANNED_COPY", () => {
  it("matches banned wording only", () => {
    expect(BANNED_COPY.test("you should apply")).toBe(true);
    expect(BANNED_COPY.test("EOIs")).toBe(false);
  });
});
