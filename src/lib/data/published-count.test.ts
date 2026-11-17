import { describe, expect, it } from "vitest";
import {
  addIntervals,
  countIn,
  isPositive,
  parseCountText,
  sumIntervals,
} from "./published-count";

describe("parseCountText", () => {
  it("maps the masked count to an interval", () => {
    expect(parseCountText("<20")).toEqual({ min: 0, max: 19 });
  });
  it("parses plain digits exactly", () => {
    expect(parseCountText("1093")).toEqual({ min: 1093, max: 1093 });
  });
  it("rejects thousands separators and negatives", () => {
    expect(() => parseCountText("1,093")).toThrow();
    expect(() => parseCountText("-1")).toThrow();
  });
});

describe("countIn", () => {
  it("returns undefined when the map was not fetched", () => {
    expect(countIn(undefined, "90")).toBeUndefined();
  });
  it("returns zero when the map exists but omits the key", () => {
    expect(countIn({}, "90")).toEqual({ min: 0, max: 0 });
  });
  it("parses a present key", () => {
    expect(countIn({ "90": "<20" }, "90")).toEqual({ min: 0, max: 19 });
  });
});

describe("interval arithmetic", () => {
  it("adds and sums intervals", () => {
    expect(addIntervals({ min: 0, max: 19 }, { min: 5, max: 5 })).toEqual({
      min: 5,
      max: 24,
    });
    expect(
      sumIntervals([
        { min: 0, max: 19 },
        { min: 5, max: 5 },
      ]),
    ).toEqual({ min: 5, max: 24 });
    expect(sumIntervals([])).toEqual({ min: 0, max: 0 });
  });
  it("is positive only when the lower bound is above zero", () => {
    expect(isPositive({ min: 0, max: 19 })).toBe(false);
    expect(isPositive({ min: 1, max: 1 })).toBe(true);
  });
});
