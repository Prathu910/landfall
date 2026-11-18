import { describe, expect, it } from "vitest";
import {
  COMPACT,
  MIN_DESIGN_TEXT,
  WIDE,
  layoutFor,
  scaleFor,
} from "./demo-layout";

describe("layoutFor", () => {
  it("uses the wide design from a 576px column up, compact below", () => {
    expect(layoutFor(576)).toBe("wide");
    expect(layoutFor(1200)).toBe("wide");
    expect(layoutFor(575)).toBe("compact");
    expect(layoutFor(288)).toBe("compact");
  });

  it("switches where the stage does", () => {
    expect(COMPACT.below).toBe(576);
  });
});

describe("scaleFor", () => {
  it("fits the design to the column and never grows past it", () => {
    expect(scaleFor(WIDE.width)).toBe(1);
    expect(scaleFor(1440)).toBe(1);
    expect(scaleFor(576)).toBeCloseTo(576 / WIDE.width);
    expect(scaleFor(288)).toBeCloseTo(288 / COMPACT.width);
  });

  it("keeps the smallest text at 12px or more from a 288px column (a 320 phone) up", () => {
    for (let column = 288; column <= 1440; column++) {
      expect(MIN_DESIGN_TEXT * scaleFor(column)).toBeGreaterThanOrEqual(12);
    }
  });
});
