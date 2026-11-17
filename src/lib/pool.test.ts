import { describe, expect, it } from "vitest";
import { countInterval, comparePool, formatInterval } from "./pool";

describe("published pool comparisons", () => {
  it("keeps a suppressed count uncertain", () => {
    expect(countInterval("<20")).toEqual({ min: 0, max: 19 });
  });
  it("does not silently turn invalid source data into zero", () => {
    expect(() => countInterval("unavailable")).toThrow();
  });
  it("adds only higher points and keeps the same-score cohort separate", () => {
    const result = comparePool({ points: [{ score: 100, count: "<20" }, { score: 95, count: "100" }, { score: 90, count: "400" }, { score: 85, count: "600" }] }, 90);
    expect(result.higher).toEqual({ min: 100, max: 119 });
    expect(result.same).toEqual({ min: 400, max: 400 });
    expect(result.total).toEqual({ min: 1100, max: 1119 });
  });
  it("formats uncertainty as a range rather than an exact rank", () => {
    expect(formatInterval({ min: 1000, max: 1019 })).toBe("1,000–1,019");
    expect(formatInterval({ min: 1000, max: 1000 })).toBe("1,000");
  });
});
