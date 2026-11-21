import { describe, expect, it } from "vitest";
import {
  BANNED_COPY,
  countClause,
  countInSentence,
  formatCount,
  formatSummed,
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

describe("formatSummed", () => {
  it("writes a sum of masked counts as under one more than its top", () => {
    expect(formatSummed({ min: 0, max: 38 })).toBe("under 39");
  });
  it("keeps a single masked count as under 20", () => {
    expect(formatSummed({ min: 0, max: 19 })).toBe("under 20");
  });
  it("keeps zero, exact counts and ranges above zero", () => {
    expect(formatSummed({ min: 0, max: 0 })).toBe("0");
    expect(formatSummed({ min: 1132, max: 1132 })).toBe("1,132");
    expect(formatSummed({ min: 98, max: 136 })).toBe("98–136");
  });
});

describe("countInSentence", () => {
  it("says a masked count may be zero, mid-sentence", () => {
    expect(countInSentence({ min: 0, max: 19 })).toBe(
      "under 20 (so may be zero)",
    );
  });
  it("matches formatCount otherwise", () => {
    expect(countInSentence({ min: 1132, max: 1132 })).toBe("1,132");
    expect(countInSentence({ min: 30, max: 49 })).toBe("30–49");
  });
});

describe("countClause", () => {
  it("capitalises a leading masked count and says it may be zero", () => {
    expect(countClause({ min: 0, max: 19 }, " EOIs have a higher score")).toBe(
      "Under 20 EOIs have a higher score, so this may be zero.",
    );
  });
  it("places a lead and a trailing phrase around the count", () => {
    expect(
      countClause(
        { min: 9464, max: 9464 },
        " EOIs",
        "The pool holds ",
        " as at Oct 2026",
      ),
    ).toBe("The pool holds 9,464 EOIs as at Oct 2026.");
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
