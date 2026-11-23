// Pure layout for the ink stamps. Sizes are SVG user units; the stamp
// components scale their viewBox to the width the layout gives them.
import type { VisaCard } from "./visa-cards";

/**
 * Stamps use Big Shoulders Stencil Display 900 (founder decision, 23 Nov
 * 2026, superseding R22). It has no width axis, so text is sized to fit and
 * the fit hook squeezes with textLength only when a line is still too wide.
 *
 * Words are sized at 0.56 em a character, as the homepage stamps always were,
 * which leaves room on each side: the face's capitals measure 0.39–0.49 em in
 * Chrome.
 */
const WORD_RATIO = 0.56;
/**
 * Width estimates use 0.44 em a character: long stamp lines (11 characters or
 * more, where fitting matters) measure 0.39–0.45 em; short ones never fill
 * their box.
 */
export const GLYPH_RATIO = 0.44;
/** textLength may compress a ring line to this share of its width. */
export const ARC_SQUEEZE = 0.8;

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
 * The word stays on one line and is squeezed when it is long ("ON 3 STATE
 * LISTS"), so the three lines keep their spacing. Word widths follow each
 * frame's inner rule (the oval's at the word's height).
 */
const VISA_EDGE_SIZE = 23.5;
export const VISA_STAMP = {
  viewBox: { x: -2, y: -4, width: 224, height: 168 },
  minWidth: 116,
  floor: VISA_EDGE_SIZE,
  /** The top and bottom lines. */
  edgeSize: VISA_EDGE_SIZE,
  /** Room for each line inside each frame's inner rule. */
  widths: {
    rect: { top: 160, word: 168, bottom: 150 },
    hex: { top: 160, word: 168, bottom: 120 },
    oval: { top: 130, word: 166, bottom: 100 },
  } satisfies Record<
    VisaCard["shape"],
    { top: number; word: number; bottom: number }
  >,
  wordMax: 30,
  fixedSizes: [VISA_EDGE_SIZE],
} as const;

/** Improve-card stamps are at most 300px on a phone and about 240px at 320px. */
export const SHIFT_STAMP = {
  viewBox: { x: -6, y: -4, width: 286, height: 78 },
  minWidth: 240,
  floor: 14.5,
  textWidth: 106,
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
  return Math.min(max, width / (text.length * WORD_RATIO));
}

/** Width in user units, letter spacing included. */
export function estimatedWidth(
  text: string,
  size: number,
  letterSpacing = 0,
): number {
  return text.length * (size * GLYPH_RATIO + letterSpacing);
}

/**
 * A ring line that can't fit its arc even with the fit hook's last-resort
 * squeeze is cut with an ellipsis, so it never runs
 * into the word box or off the ring.
 */
export function capArcText(
  text: string,
  size: number,
  arcWidth: number,
  letterSpacing = 0,
): string {
  const fits = (candidate: string) =>
    estimatedWidth(candidate, size, letterSpacing) * ARC_SQUEEZE <= arcWidth;
  if (fits(text)) return text;
  let kept = text.length - 1;
  while (kept > 0 && !fits(`${text.slice(0, kept).trimEnd()}…`)) kept -= 1;
  return `${text.slice(0, kept).trimEnd()}…`;
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

/** The ring line's baseline radius; its glyphs stand outside it. */
const RING_RADIUS = 120;
/** The bottom line hangs from this radius, its glyphs outside it. */
const BOTTOM_RADIUS = 108;
const BOX_STROKE = 5;
const ARC_CLEARANCE = 10;

/** The length of arc whose glyphs stay this far above or below the centre. */
function clearArc(radius: number, distance: number): number {
  const halfAngle = Math.PI / 2 - Math.asin(Math.min(1, distance / radius));
  return 2 * radius * halfAngle;
}

/**
 * Room on each ring arc clear of the word box, which grows with its lines.
 * The arcs' inner edges are nearest the box, so they set the clearance.
 */
export function bigArcWidths(boxHeight: number): {
  ring: number;
  bottom: number;
} {
  const distance = boxHeight / 2 + BOX_STROKE / 2 + ARC_CLEARANCE;
  return {
    ring: clearArc(RING_RADIUS, distance),
    bottom: clearArc(BOTTOM_RADIUS, distance),
  };
}

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
