/**
 * Finds colour literals that would skip the theme tokens: hex, colour
 * functions (rgb(), hsl() and the rest) and named colours. CSS modules and
 * SVG attributes in TSX must use tokens so both themes reach them. Print
 * blocks are exempt (print is always the light design), and so are the
 * keywords that carry no colour of their own.
 */

export type ColourHit = { line: number; value: string };

const HEX = /#[0-9a-f]{3,8}\b/gi;
const FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;
const KEYWORDS = new Set([
  "transparent",
  "currentcolor",
  "inherit",
  "initial",
  "unset",
  "revert",
  "none",
]);

/** The CSS named colours (CSS Color 4), lower case. */
const NAMED = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black
  blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse
  chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
  darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta
  darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
  deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
  fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey
  honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
  lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
  lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
  limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
  mediumpurple mediumseagreen mediumslateblue mediumspringgreen
  mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
  navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff
  peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
  saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
  slateblue slategray slategrey snow springgreen steelblue tan teal thistle
  tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(
    /\s+/,
  ),
);

/** Replaces a match with spaces, keeping newlines so line numbers hold. */
const blank = (text: string) => text.replace(/[^\n]/g, " ");

/** Blanks every `@media print { … }` block, nested braces included. */
function blankPrintBlocks(css: string): string {
  let out = css;
  let from = 0;
  for (;;) {
    const start = out.indexOf("@media print", from);
    if (start < 0) return out;
    let depth = 0;
    let cursor = out.indexOf("{", start);
    for (; cursor < out.length; cursor++) {
      if (out[cursor] === "{") depth++;
      if (out[cursor] === "}" && --depth === 0) break;
    }
    out =
      out.slice(0, start) +
      blank(out.slice(start, cursor + 1)) +
      out.slice(cursor + 1);
    from = cursor + 1;
  }
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}

/** Literal colours in one declaration value, by their offset in the value. */
function valueHits(value: string): { index: number; value: string }[] {
  const hits = [
    ...[...value.matchAll(HEX)],
    ...[...value.matchAll(FUNCTION)],
  ].map((match) => ({ index: match.index, value: match[0] }));
  // A word is a named colour unless it names a function or a variable.
  for (const match of value.matchAll(/(?<![\w-])[a-z]+(?![\w(-])/gi)) {
    const word = match[0].toLowerCase();
    if (NAMED.has(word) && !KEYWORDS.has(word))
      hits.push({ index: match.index, value: match[0] });
  }
  return hits;
}

/** Colour literals in a stylesheet's screen styles. */
export function findCssColourLiterals(css: string): ColourHit[] {
  const screen = blankPrintBlocks(
    css
      .replace(/\/\*[\s\S]*?\*\//g, blank)
      .replace(/"[^"\n]*"|'[^'\n]*'/g, blank)
      // A feature test's probe colours are not styles.
      .replace(/@supports[^{]*/g, blank),
  );
  const hits: ColourHit[] = [];
  for (const declaration of screen.matchAll(/([\w-]+)\s*:([^;{}]+)[;}]/g)) {
    const [, property, value] = declaration;
    const valueStart = declaration.index + declaration[0].indexOf(value);
    for (const hit of valueHits(value))
      hits.push({
        line: lineOf(screen, valueStart + hit.index),
        value: `${property}: ${hit.value}`,
      });
  }
  return hits;
}

const SVG_ATTRIBUTE =
  /\b(fill|stroke|stopColor|floodColor|lightingColor)=\{?\s*["'`]([^"'`]+)["'`]/g;

/** Literal colours in TSX SVG paint attributes (`fill="#fff"` and kin), outside masks. */
export function findTsxColourLiterals(tsx: string): ColourHit[] {
  // Inside <mask>, white and black are luminance, not paint.
  const source = tsx.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|<mask[\s>][\s\S]*?<\/mask>/g,
    blank,
  );
  return [...source.matchAll(SVG_ATTRIBUTE)].flatMap((match) =>
    valueHits(match[2]).map(() => ({
      line: lineOf(source, match.index),
      value: `${match[1]}="${match[2]}"`,
    })),
  );
}
