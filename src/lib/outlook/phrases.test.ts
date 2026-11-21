import { describe, expect, it } from "vitest";
import type { StateLabel } from "./label-state";
import { monthsOfSix } from "./phrases";

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
