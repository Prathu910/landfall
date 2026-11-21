import { describe, expect, it } from "vitest";
import {
  BIG_STAMP,
  ARC_SQUEEZE,
  bigArcWidths,
  bigWordLayout,
  capArcText,
  estimatedWidth,
  fitStretch,
  MIN_STRETCH,
  STAMP_STRETCH,
  stampStretch,
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
  it("fits the text to the width with Archivo's 0.628 ratio", () => {
    // 250 / (11 × 0.628). R22 moved stamps to Archivo; see R23 in the report.
    expect(stampFontSize("COMPETITIVE", 250, 56)).toBeCloseTo(36.2, 1);
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

describe("estimatedWidth", () => {
  it("scales with size, stretch and letter spacing", () => {
    expect(estimatedWidth("ABCD", 10, 100)).toBeCloseTo(25.12, 5);
    expect(estimatedWidth("ABCD", 10, 50)).toBeCloseTo(12.56, 5);
    expect(estimatedWidth("ABCD", 10, 100, 2)).toBeCloseTo(33.12, 5);
  });
});

describe("stampStretch", () => {
  it("keeps the wide default when the text has room", () => {
    expect(stampStretch("STRONG", 30, 250)).toBe(STAMP_STRETCH);
  });

  it("narrows the width axis just enough to fit", () => {
    const stretch = stampStretch("ON 3 STATE LISTS", 23.5, 168);
    expect(stretch).toBeLessThan(STAMP_STRETCH);
    expect(estimatedWidth("ON 3 STATE LISTS", 23.5, stretch)).toBeCloseTo(
      168,
      5,
    );
  });

  it("never goes below the face's narrowest width", () => {
    expect(stampStretch("A VERY LONG STAMP WORD INDEED", 30, 100)).toBe(
      MIN_STRETCH,
    );
  });
});

describe("fitStretch", () => {
  it("narrows in proportion to the overflow", () => {
    expect(fitStretch(116, 300, 250)).toBeCloseTo(96.67, 2);
  });

  it("never widens text that already fits", () => {
    expect(fitStretch(116, 200, 250)).toBe(116);
  });

  it("stops at the narrowest width", () => {
    expect(fitStretch(80, 400, 100)).toBe(MIN_STRETCH);
  });
});

describe("capArcText", () => {
  it("keeps the bottom line whole around a two-line word box", () => {
    const box = bigWordLayout(2, 24.88).boxHeight;
    const line = "OCT 2026 • 75 POINTS";
    expect(capArcText(line, 20, bigArcWidths(box).bottom, 2)).toBe(line);
  });

  it("leaves a ring line that fits unchanged", () => {
    expect(capArcText("SUBCLASS 190 TAS", 22, 270, 2)).toBe("SUBCLASS 190 TAS");
  });

  it("cuts a line too long for the arc even at the narrowest width", () => {
    const long = "OCT 2026 • 85 POINTS • A VERY LONG EXTRA NOTE THAT RUNS ON";
    const capped = capArcText(long, 20, 240, 2);
    expect(capped.endsWith("…")).toBe(true);
    expect(capped.length).toBeLessThan(long.length);
    const squeezed = estimatedWidth(capped, 20, MIN_STRETCH, 2) * ARC_SQUEEZE;
    expect(squeezed).toBeLessThanOrEqual(240);
  });
});

describe("bigArcWidths", () => {
  it("leaves about 264 and 225 units of arc around a one-line box", () => {
    const widths = bigArcWidths(bigWordLayout(1, 36).boxHeight);
    expect(widths.ring).toBeCloseTo(263.85, 1);
    expect(widths.bottom).toBeCloseTo(225.04, 1);
  });

  it("shortens both arcs when a second line makes the box taller", () => {
    const one = bigArcWidths(bigWordLayout(1, 40).boxHeight);
    const two = bigArcWidths(bigWordLayout(2, 40).boxHeight);
    expect(two.ring).toBeLessThan(one.ring);
    expect(two.bottom).toBeLessThan(one.bottom);
  });
});
