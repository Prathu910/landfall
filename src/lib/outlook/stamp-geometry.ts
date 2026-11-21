// Pure layout for the ink stamps. Sizes are SVG user units; the stamp
// components scale their viewBox to the width the layout gives them.
import type { VisaCard } from "./visa-cards";

/**
 * Archivo 800 capitals at 100% stretch average 0.61–0.69 em each across the
 * stamp words (measured in Chrome), so sizes assume about 0.628 em a character.
 */
const FIT_RATIO = 0.628;

/** Stamps set Archivo wide, like the report headings (ruling R22)... */
export const STAMP_STRETCH = 116;
/** ...and narrow along its width axis, down to its narrowest cut, to fit. */
export const MIN_STRETCH = 62;
/** textLength may compress a ring line's narrowest cut to this share. */
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
 * The word stays on one line and narrows along Archivo's width axis when it
 * is long ("ON 3 STATE LISTS"), so the three lines keep their spacing.
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
    oval: { top: 130, word: 156, bottom: 100 },
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

/** Width in user units at a stretch (percent), letter spacing included. */
export function estimatedWidth(
  text: string,
  size: number,
  stretch: number,
  letterSpacing = 0,
): number {
  const advance = (size * FIT_RATIO * stretch) / 100 + letterSpacing;
  return text.length * advance;
}

function clampStretch(stretch: number): number {
  return Math.min(STAMP_STRETCH, Math.max(MIN_STRETCH, stretch));
}

/**
 * The stretch the server renders, so text fits before the fit hook runs (or
 * where it can't measure, such as a tree that is hidden until printing).
 */
export function stampStretch(
  text: string,
  size: number,
  width: number,
  letterSpacing = 0,
): number {
  const perCharacter = width / text.length - letterSpacing;
  return clampStretch((100 * perCharacter) / (size * FIT_RATIO));
}

/** The fit hook's next stretch after measuring; it only ever narrows. */
export function fitStretch(
  stretch: number,
  measuredWidth: number,
  maxWidth: number,
): number {
  if (measuredWidth <= maxWidth) return stretch;
  return Math.max(MIN_STRETCH, (stretch * maxWidth) / measuredWidth);
}

/**
 * A ring line that can't fit its arc even at the narrowest stretch and the
 * fit hook's last-resort squeeze is cut with an ellipsis, so it never runs
 * into the word box or off the ring.
 */
export function capArcText(
  text: string,
  size: number,
  arcWidth: number,
  letterSpacing = 0,
): string {
  const fits = (candidate: string) =>
    estimatedWidth(candidate, size, MIN_STRETCH, letterSpacing) * ARC_SQUEEZE <=
    arcWidth;
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
