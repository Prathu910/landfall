import { describe, expect, it } from "vitest";
import { FAVICON_MARK, MARK_BARS, MARK_COLOURS, MARK_RING } from "./logo";

describe("C1 logo geometry", () => {
  it("draws a ring at r=18 with a 3.5 stroke", () => {
    expect(MARK_RING).toEqual({ cx: 24, cy: 24, r: 18, strokeWidth: 3.5 });
  });

  it("draws three bars bottom-aligned at y=33, the last in saffron", () => {
    expect(MARK_BARS).toEqual([
      { x: 15, y: 25, width: 4.5, height: 8, accent: false },
      { x: 21.75, y: 20, width: 4.5, height: 13, accent: false },
      { x: 28.5, y: 15, width: 4.5, height: 18, accent: true },
    ]);
    for (const bar of MARK_BARS) expect(bar.y + bar.height).toBe(33);
  });

  it("uses the Data Desk colours", () => {
    expect(MARK_COLOURS.ink).toBe("#1B1A17");
    expect(MARK_COLOURS.reversed).toBe("#F3EEE3");
    expect(MARK_COLOURS.accent).toBe("#D9731A");
  });

  it("has a favicon variant with a 5 stroke and square bars", () => {
    expect(FAVICON_MARK.ring.strokeWidth).toBe(5);
    expect(FAVICON_MARK.bars.map((b) => b.x)).toEqual([14, 21, 28]);
    expect(FAVICON_MARK.bars.map((b) => b.width)).toEqual([6, 6, 6]);
    expect(FAVICON_MARK.bars.map((b) => b.height)).toEqual([10, 15, 20]);
  });
});
