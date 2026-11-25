/**
 * Picks a card title's size before rendering, from an estimate of Archivo's
 * width (800 weight, 112% width, -0.025em tracking). The estimate errs wide,
 * so a title it passes fits; the renderer's overflow check stays the guard
 * for anything it gets wrong.
 */

/**
 * Each character's advance in em at the title's weight, width and tracking,
 * measured in Chrome from the bundled face (Nov 2026). Kerning mostly narrows
 * a word, so the sum errs wide; MARGIN adds a little more.
 */
const ADVANCE: Record<string, number> = {
  0: 0.677,
  1: 0.638,
  2: 0.676,
  3: 0.679,
  4: 0.675,
  5: 0.679,
  6: 0.68,
  7: 0.649,
  8: 0.686,
  9: 0.68,
  a: 0.668,
  b: 0.671,
  c: 0.663,
  d: 0.671,
  e: 0.671,
  f: 0.389,
  g: 0.671,
  h: 0.665,
  i: 0.276,
  j: 0.274,
  k: 0.644,
  l: 0.276,
  m: 1.022,
  n: 0.665,
  o: 0.68,
  p: 0.671,
  q: 0.671,
  r: 0.417,
  s: 0.617,
  t: 0.416,
  u: 0.664,
  v: 0.612,
  w: 0.939,
  x: 0.66,
  y: 0.612,
  z: 0.57,
  A: 0.811,
  B: 0.801,
  C: 0.818,
  D: 0.816,
  E: 0.753,
  F: 0.691,
  G: 0.885,
  H: 0.859,
  I: 0.325,
  J: 0.655,
  K: 0.832,
  L: 0.661,
  M: 1.001,
  N: 0.858,
  O: 0.882,
  P: 0.751,
  Q: 0.882,
  R: 0.813,
  S: 0.754,
  T: 0.733,
  U: 0.847,
  V: 0.788,
  W: 1.066,
  X: 0.809,
  Y: 0.796,
  Z: 0.741,
  "(": 0.348,
  ")": 0.348,
  "-": 0.348,
  ",": 0.308,
  ".": 0.308,
  "/": 0.28,
  "&": 0.88,
  "'": 0.246,
  "+": 0.666,
  ":": 0.314,
  " ": 0.219,
};
/** An unlisted character counts as the widest letter. */
const WIDEST = 1.066;
const MARGIN = 1.02;

/** The title's line height (card.css `.title`) and the padding a `.fit` title adds. */
export const LINE_HEIGHT = 0.98;
const FIT_PADDING = 0.06;

/** The estimated width of `text` in em. */
export function textEm(text: string): number {
  const sum = [...text].reduce(
    (total, char) => total + (ADVANCE[char] ?? WIDEST),
    0,
  );
  return sum * MARGIN;
}

/**
 * Lines `text` wraps to at `size` px in a box `width` px wide, breaking only
 * between words; Infinity when one word is wider than the box.
 */
export function estimatedLines(
  text: string,
  size: number,
  width: number,
): number {
  const capacity = width / size;
  let lines = 1;
  let line = "";
  for (const word of text.split(" ")) {
    if (textEm(word) > capacity) return Infinity;
    const next = line ? `${line} ${word}` : word;
    if (textEm(next) <= capacity) {
      line = next;
    } else {
      lines += 1;
      line = word;
    }
  }
  return lines;
}

export type TitleBox = {
  /** Font sizes to try, largest first. */
  sizes: readonly number[];
  width: number;
  /** The box's max height, so fewer lines fit at the larger sizes. */
  height: number;
};

/**
 * The spotlight's name, beside its stamp: card.css's 816px content less the
 * 290px stamp column and 20px gap. Two lines at 80 or 64px, three at 52
 * or 46, four at 40, which fits every occupation name in the index.
 */
export const SPOTLIGHT_TITLE: TitleBox = {
  sizes: [80, 64, 52, 46, 40],
  width: 506,
  height: 162,
};

/** How many lines of a `.fit` title fit in `height` at `size`. */
function linesThatFit(size: number, height: number): number {
  return Math.floor((height - FIT_PADDING * size) / (LINE_HEIGHT * size));
}

/**
 * The largest size at which `text` is estimated to fit `box`, with whether
 * it does. When none fits it returns the smallest size, and the render fails.
 */
export function fitTitle(
  text: string,
  box: TitleBox,
): { size: number; fits: boolean } {
  for (const size of box.sizes) {
    if (estimatedLines(text, size, box.width) <= linesThatFit(size, box.height))
      return { size, fits: true };
  }
  return { size: box.sizes[box.sizes.length - 1], fits: false };
}
