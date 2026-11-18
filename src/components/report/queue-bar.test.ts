import { describe, expect, it } from "vitest";
import { segmentWidth } from "./queue-bar";

const total = { min: 100, max: 100 };

describe("segmentWidth", () => {
  it("scales by interval midpoint", () => {
    expect(segmentWidth({ min: 20, max: 30 }, total)).toBe("max(25%, 2px)");
  });
  it("keeps a 2px minimum for a non-zero max", () => {
    expect(segmentWidth({ min: 0, max: 19 }, { min: 1e6, max: 1e6 })).toContain(
      "2px",
    );
  });
  it("is zero for an empty segment", () => {
    expect(segmentWidth({ min: 0, max: 0 }, total)).toBe("0");
  });
  it("is zero-share safe when the total is zero", () => {
    expect(segmentWidth({ min: 0, max: 19 }, { min: 0, max: 0 })).toBe(
      "max(0%, 2px)",
    );
  });
});
