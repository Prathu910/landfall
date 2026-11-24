/** Checks that card copy stays inside the bundled font subsets (spec 6.7). */

export type CodepointRange = [number, number];

/** Every `U+XXXX` or `U+XXXX-YYYY` in the css's `unicode-range` declarations. */
export function parseUnicodeRange(css: string): CodepointRange[] {
  const ranges: CodepointRange[] = [];
  for (const declaration of css.matchAll(/unicode-range:\s*([^;]+);/g)) {
    for (const part of declaration[1].split(",")) {
      const match = /U\+([0-9A-Fa-f]+)(?:-([0-9A-Fa-f]+))?/.exec(part.trim());
      if (!match) continue;
      const start = parseInt(match[1], 16);
      ranges.push([start, match[2] ? parseInt(match[2], 16) : start]);
    }
  }
  return ranges;
}

/** The distinct characters of `text` that no range covers. */
export function charsOutside(text: string, ranges: CodepointRange[]): string[] {
  const outside = new Set<string>();
  for (const char of text) {
    const code = char.codePointAt(0) as number;
    if (!ranges.some(([from, to]) => code >= from && code <= to)) {
      outside.add(char);
    }
  }
  return [...outside];
}
