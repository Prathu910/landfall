import { describe, expect, it } from "vitest";
import type { StateLabel } from "./label-state";
import { lowerFirst, monthsOfSix } from "./phrases";

const STATE: StateLabel = {
  state: "NT",
  visa: "190",
  label: "competitive",
  flag: null,
  rules: "",
  confirmedAtOrBelow: 0,
  monthsAtOrBelow6: 2,
  monthsFetched6: 6,
  latest: null,
};

describe("monthsOfSix", () => {
  it("counts out of 6 when all 6 months were published", () => {
    expect(monthsOfSix(STATE)).toBe("2 of the last 6 months");
  });

  it("counts out of the published months when some weren't fetched", () => {
    expect(monthsOfSix({ ...STATE, monthsFetched6: 4 })).toBe(
      "2 of the 4 published months of the last 6",
    );
  });
});

describe("lowerFirst", () => {
  it("lower-cases an ordinary leading word", () => {
    expect(lowerFirst("Submit EOI (189)")).toBe("submit EOI (189)");
  });

  it("keeps acronyms and proper names as written", () => {
    expect(lowerFirst("EOI submitted")).toBe("EOI submitted");
    expect(lowerFirst("Superior English (80 points)")).toBe(
      "Superior English (80 points)",
    );
    expect(lowerFirst("Professional Year, +5")).toBe("Professional Year, +5");
  });
});
