import { describe, expect, it } from "vitest";
import { FEES } from "../../data/guide/fees";
import { compareRows, differenceAnswer } from "./compare";

describe("compareRows", () => {
  it("takes each visa's charge from the sourced fees", () => {
    const row = compareRows(FEES, null).find((r) =>
      r.label.includes("visa charge"),
    );
    expect(row?.values).toEqual({
      "189": "AUD 6,135",
      "190": "AUD 6,140",
      "491": "AUD 6,140",
    });
  });
  it("adds the list counts only when the federal list was read", () => {
    const withCounts = compareRows(FEES, {
      "189": 212,
      "190": 427,
      "491": 504,
    });
    expect(withCounts.at(-1)?.values["491"]).toBe("504");
    expect(
      compareRows(FEES, null).some((r) => r.label.includes("Occupations")),
    ).toBe(false);
  });
});

describe("differenceAnswer", () => {
  it("says which visas are permanent and what nomination adds", () => {
    expect(differenceAnswer(5, 15)).toBe(
      "The 189 and 190 are permanent; the 491 is a 5-year provisional regional visa with a path to the permanent 191. The 190 adds 5 points for state nomination and the 491 adds 15 for state nomination or family sponsorship; the 189 has no nomination.",
    );
  });
});
