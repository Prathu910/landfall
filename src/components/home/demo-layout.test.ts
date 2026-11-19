import { readFileSync } from "node:fs";
import { join } from "node:path";
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
    expect(layoutFor(278)).toBe("compact");
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
    expect(scaleFor(278)).toBeCloseTo(278 / COMPACT.width);
  });

  // A 320 phone less the site's 21px phone gutters (globals.css) is 278.
  it("keeps the smallest text at 12px or more from a 278px column (a 320 phone) up", () => {
    for (let column = 278; column <= 1440; column++) {
      expect(MIN_DESIGN_TEXT * scaleFor(column)).toBeGreaterThanOrEqual(12);
    }
  });
});

describe("the poster's CSS", () => {
  const read = (name: string) =>
    readFileSync(join(process.cwd(), "src/components/home", name), "utf8");
  // Every block that ends with this selector, merged
  const rule = (css: string, selector: string) =>
    [...css.matchAll(new RegExp(`(^|\\n)${selector}\\s*\\{([^}]*)\\}`, "g"))]
      .map((m) => m[2])
      .join("\n");
  const px = (block: string, property: string) =>
    Number(new RegExp(`(^|\\s)${property}:\\s*(\\d+)px`).exec(block)?.[2]);

  it("repeats demo-layout.ts's sizes and switch, and no other", () => {
    const css = read("hero-demo.module.css");
    const sizes = new Set(
      [...css.matchAll(/(\d+)px/g)]
        .map((m) => Number(m[1]))
        .filter((n) => n > 1),
    );
    expect([...sizes].sort()).toEqual(
      [WIDE.width, WIDE.height, COMPACT.width, COMPACT.height, COMPACT.below]
        .filter((n, i, all) => all.indexOf(n) === i)
        .sort(),
    );
    expect(css).toContain(`atan2(100cqw, ${WIDE.width}px)`);
    expect(css).toContain(`atan2(100cqw, ${COMPACT.width}px)`);
    expect(css).toContain(`calc(${WIDE.height}px * var(--scale))`);
    expect(css).toContain(`calc(${COMPACT.height}px * var(--scale))`);
    expect(css).toContain(`@container (width < ${COMPACT.below}px)`);
    expect(px(rule(css, "\\.compact"), "height")).toBe(COMPACT.height);
    expect(px(rule(css, "\\.frame"), "height")).toBe(WIDE.height);
  });

  it("bleeds the window and the page the same 40px off the stage's foot", () => {
    const css = read("demo-sheet.module.css");
    const window = rule(css, "\\.window");
    const page = rule(css, "\\.page");
    expect(px(window, "top") + px(window, "height") - WIDE.height).toBe(40);
    expect(px(page, "top") + px(page, "height") - COMPACT.height).toBe(40);
  });
});
