export const MIN_PX = 12;
export const MIN_REM = 0.75;

export type SmallFontSize = { line: number; value: string };

const LENGTH = /(?<![/\d.])(\d*\.?\d+)(px|rem|em)\b/g;

function isSmall(amount: string, unit: string): boolean {
  return Number(amount) < (unit === "px" ? MIN_PX : MIN_REM);
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/** Blank out comments, keeping newlines so line numbers stay right. */
function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));
}

function findInCss(source: string): SmallFontSize[] {
  const clean = stripCssComments(source);
  const hits: SmallFontSize[] = [];
  const declaration = /(?<![-\w])(font-size|font)\s*:\s*([^;}]+)/g;
  for (const m of clean.matchAll(declaration)) {
    const value = m[2];
    const start = (m.index ?? 0) + m[0].indexOf(value);
    for (const length of value.matchAll(LENGTH)) {
      if (isSmall(length[1], length[2])) {
        const at = start + (length.index ?? 0);
        hits.push({ line: lineOf(clean, at), value: length[0] });
      }
    }
  }
  return hits;
}

function findInScript(source: string): SmallFontSize[] {
  const hits: SmallFontSize[] = [];
  const attribute =
    /font-?[sS]ize\s*[=:]\s*\{?\s*["'`]?\s*(\d*\.?\d+)\s*(px|rem|em)?/g;
  for (const m of source.matchAll(attribute)) {
    const unit = m[2] ?? "px";
    if (isSmall(m[1], unit)) {
      hits.push({
        line: lineOf(source, m.index ?? 0),
        value: `${m[1]}${unit}`,
      });
    }
  }
  return hits;
}

/** Every font size under the floor (12px / 0.75rem) in one source file. */
export function findSmallFontSizes(
  source: string,
  kind: "css" | "tsx",
): SmallFontSize[] {
  return kind === "css" ? findInCss(source) : findInScript(source);
}
