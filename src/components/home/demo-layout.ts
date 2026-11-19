import type { SheetLayout } from "./demo-scene";

/**
 * The demo's two designs. Their smallest text is MIN_DESIGN_TEXT design
 * pixels, and the wide design is used only from a column where it scales to
 * 0.8 or more, so nothing renders under 12px (12 / 15 = 0.8). The poster's
 * CSS (hero-demo.module.css) repeats these sizes and the breakpoint.
 */
export const MIN_DESIGN_TEXT = 15;
export const WIDE = { width: 720, height: 460 };
export const COMPACT = { below: 576, width: 346, height: 720 };

export function layoutFor(column: number): SheetLayout {
  return column < COMPACT.below ? "compact" : "wide";
}

/** The stage's scale in a column: fitted, never grown past the design. */
export function scaleFor(column: number): number {
  const design = layoutFor(column) === "wide" ? WIDE : COMPACT;
  return Math.min(1, column / design.width);
}
