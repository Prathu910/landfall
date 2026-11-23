/**
 * Browsers without `light-dark()` (before Safari 17.5, Chrome 123 and
 * Firefox 120) drop every colour token as invalid. globals.css ends with an
 * `@supports not` block that restates each token with its light value;
 * `lightFallback` derives that block from the tokens, and the palette test
 * fails if the two ever differ.
 */

/** `light-dark(a, b)` → `a`, for every call in the value (nesting allowed). */
export function lightValue(value: string): string {
  const open = "light-dark(";
  let out = "";
  let index = 0;
  for (;;) {
    const start = value.indexOf(open, index);
    if (start < 0) return out + value.slice(index);
    out += value.slice(index, start);
    const { light, end } = firstArgument(value, start + open.length);
    out += lightValue(light);
    index = end + 1;
  }
}

/** The first argument of a call whose arguments start at `from`, and the index of its closing bracket. */
function firstArgument(value: string, from: number) {
  let depth = 0;
  let comma = -1;
  for (let cursor = from; cursor < value.length; cursor++) {
    const char = value[cursor];
    if (char === "(") depth++;
    if (char === ")" && depth-- === 0) {
      return { light: value.slice(from, comma).trim(), end: cursor };
    }
    if (char === "," && depth === 0 && comma < 0) comma = cursor;
  }
  throw new Error(`Unclosed light-dark() in: ${value}`);
}

/** Every `--token: …light-dark(…)…;` in the CSS, restated with its light value. */
export function lightFallback(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/(--[\w-]+):\s*([^;{}]+);/g)]
    .filter(([, , value]) => value.includes("light-dark("))
    .map(
      ([, name, value]) =>
        `${name}: ${lightValue(value.replace(/\s+/g, " ").trim())};`,
    );
}
