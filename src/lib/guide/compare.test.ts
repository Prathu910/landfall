import { describe, expect, it } from "vitest";
import { FEES } from "../../data/guide/fees";
import { compareRows } from "./compare";

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
