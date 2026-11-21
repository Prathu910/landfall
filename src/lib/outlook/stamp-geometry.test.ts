import { describe, expect, it } from "vitest";
import {
  BIG_STAMP,
  bigWordLayout,
  longestLine,
  SHIFT_STAMP,
  VISA_STAMP,
  floorUnits,
  stampFontSize,
  stampLines,
  stampTextSize,
} from "./stamp-geometry";
import type { StampSpec } from "./stamp-geometry";

describe("stampLines", () => {
  it("breaks a long word into lines of at most 12 characters", () => {
    expect(stampLines("NOT ELIGIBLE YET")).toEqual(["NOT ELIGIBLE", "YET"]);
  });

  it("keeps a word of 12 characters or fewer on one line", () => {
    expect(stampLines("COMPETITIVE")).toEqual(["COMPETITIVE"]);
  });

  it("keeps a single word longer than the limit whole", () => {
    expect(stampLines("UNBREAKABLEWORD")).toEqual(["UNBREAKABLEWORD"]);
  });

  it("honours a custom limit", () => {
    expect(stampLines("TOO FEW TO COUNT", 8)).toEqual(["TOO FEW", "TO COUNT"]);
  });
});

describe("stampFontSize", () => {
  it("fits the text to the width with the mockup's 0.56 ratio", () => {
    // 250 / (11 × 0.56); the brief's hand-derived 36.2 disagrees (see report).
    expect(stampFontSize("COMPETITIVE", 250, 56)).toBeCloseTo(40.58, 1);
  });

  it("never exceeds the maximum for short text", () => {
    expect(stampFontSize("NO", 250, 56)).toBe(56);
  });
});

describe("floorUnits", () => {
  it("converts the 12px floor into viewBox units at the smallest width", () => {
    expect(floorUnits(368, 230)).toBeCloseTo(19.2, 5);
  });
});

describe("stampTextSize", () => {
  it("raises a fitted size to the floor; the fit hook then squeezes it", () => {
    expect(stampTextSize("TOO FEW TO COUNT", 168, 30, 25)).toBe(25);
  });

  it("keeps a fitted size above the floor", () => {
    expect(stampTextSize("NO", 168, 30, 20)).toBe(30);
  });
});

describe("stamp text stays at or above 12px at each stamp's smallest width", () => {
  const specs: [string, StampSpec][] = [
    ["big", BIG_STAMP],
    ["visa", VISA_STAMP],
    ["shift", SHIFT_STAMP],
  ];

  it.each(specs)("%s stamp fixed sizes clear the floor", (_name, spec) => {
    const floor = floorUnits(spec.viewBox.width, spec.minWidth);
    expect(spec.floor).toBeGreaterThanOrEqual(floor);
    for (const size of spec.fixedSizes) {
      expect(size).toBeGreaterThanOrEqual(floor);
    }
  });
});

describe("bigWordLayout", () => {
  it("matches the mockup for one line", () => {
    expect(bigWordLayout(1, 40)).toEqual({
      baselines: [172],
      boxY: 118,
      boxHeight: 84,
    });
  });

  it("grows the box by one line and centres two lines", () => {
    expect(bigWordLayout(2, 40)).toEqual({
      baselines: [152, 192],
      boxY: 98,
      boxHeight: 124,
    });
  });
});

describe("longestLine", () => {
  it("returns the line that sets the fitted size", () => {
    expect(longestLine(["TOO FEW TO", "COUNT"])).toBe("TOO FEW TO");
  });
});
