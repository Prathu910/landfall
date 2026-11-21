// Pure layout for the ink stamps. Sizes are SVG user units; the stamp
// components scale their viewBox to the width the layout gives them.

/** The mockup's guess at a stencil capital's width, as a share of its size. */
const FIT_RATIO = 0.56;

/** Readable text never renders below this (ENGINEERING.md, 12px floor). */
const MIN_RENDERED_PX = 12;

type ViewBox = { x: number; y: number; width: number; height: number };

export type StampSpec = {
  viewBox: ViewBox;
  /** The narrowest the layout may draw the stamp, in CSS pixels (spec 8). */
  minWidth: number;
  /** The smallest text size, in user units, that stays readable at minWidth. */
  floor: number;
  /** Every text size the stamp uses without fitting. */
  fixedSizes: readonly number[];
};

const BIG_RING_SIZE = 22;
const BIG_BOTTOM_SIZE = 20;
/** The big stamp is about 230px wide on a phone (spec 8). */
export const BIG_STAMP = {
  viewBox: { x: -24, y: -24, width: 368, height: 368 },
  minWidth: 230,
  floor: 19.5,
  ringSize: BIG_RING_SIZE,
  bottomSize: BIG_BOTTOM_SIZE,
  wordWidth: 250,
  wordMax: 56,
  fixedSizes: [BIG_RING_SIZE, BIG_BOTTOM_SIZE],
} as const;

/**
 * Visa stamps sit in 116px rows on a phone (spec 8), so their text is larger
 * relative to the frame than the mockup's and the viewBox margin is tighter.
 * The word stays on one line: the stencil face is narrow enough for "ON 3
 * STATE LISTS" at the floor, and the fit hook squeezes anything wider.
 */
const VISA_EDGE_SIZE = 23.5;
export const VISA_STAMP = {
  viewBox: { x: -2, y: -4, width: 224, height: 168 },
  minWidth: 116,
  floor: VISA_EDGE_SIZE,
  /** The top and bottom lines. */
  edgeSize: VISA_EDGE_SIZE,
  topWidth: 130,
  bottomWidth: 110,
  wordWidth: 168,
  wordMax: 30,
  fixedSizes: [VISA_EDGE_SIZE],
} as const;

/** Improve-card stamps are at most 300px on a phone and about 240px at 320px. */
export const SHIFT_STAMP = {
  viewBox: { x: -6, y: -4, width: 286, height: 78 },
  minWidth: 240,
  floor: 14.5,
  textWidth: 104,
  textMax: 17,
  fixedSizes: [],
} as const;

export function viewBoxAttr(viewBox: ViewBox): string {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}

/**
 * Words longer than maxChars break greedily at spaces; a single word that is
 * itself too long stays whole, and the fit hook squeezes it instead.
 */
export function stampLines(word: string, maxChars = 12): string[] {
  if (word.length <= maxChars) return [word];
  const lines: string[] = [];
  for (const part of word.split(" ")) {
    const last = lines[lines.length - 1];
    const joined = last === undefined ? part : `${last} ${part}`;
    if (last !== undefined && joined.length <= maxChars) {
      lines[lines.length - 1] = joined;
    } else {
      lines.push(part);
    }
  }
  return lines;
}

export function stampFontSize(
  text: string,
  width: number,
  max: number,
): number {
  return Math.min(max, width / (text.length * FIT_RATIO));
}

/** The user-unit size that renders at 12px when the stamp is minWidth wide. */
export function floorUnits(viewBoxWidth: number, minWidth: number): number {
  return (MIN_RENDERED_PX * viewBoxWidth) / minWidth;
}

/**
 * A fitted size that never drops below the floor. Text that is then too wide
 * is squeezed by useFitStampText rather than shrunk under 12px.
 */
export function stampTextSize(
  text: string,
  width: number,
  max: number,
  floor: number,
): number {
  return Math.max(floor, stampFontSize(text, width, max));
}

export function longestLine(lines: string[]): string {
  return lines.reduce((longest, line) =>
    line.length > longest.length ? line : longest,
  );
}

export type BigWordLayout = {
  baselines: number[];
  boxY: number;
  boxHeight: number;
};

/** The word's box grows by one line height per extra line, centred at 160. */
export function bigWordLayout(lineCount: number, size: number): BigWordLayout {
  const extra = (lineCount - 1) * size;
  const firstBaseline = 172 - extra / 2;
  const baselines = Array.from(
    { length: lineCount },
    (_, index) => firstBaseline + index * size,
  );
  return { baselines, boxY: 118 - extra / 2, boxHeight: 84 + extra };
}
