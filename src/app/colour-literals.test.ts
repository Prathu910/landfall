import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  findCssColourLiterals,
  findTsxColourLiterals,
  type ColourHit,
} from "./colour-literals";

const ROOT = process.cwd();
/** Print-only trees: print is always the light design. */
const PRINT_TSX = /src\/components\/report\/print-[\w-]+\.tsx$/;
/** The Instagram card templates and their stylesheet, themed by tokens.ts. */
const SOCIAL = "scripts/social";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function scan(
  filter: (file: string) => boolean,
  find: (source: string) => ColourHit[],
): string[] {
  return [...walk(join(ROOT, "src")), ...walk(join(ROOT, SOCIAL))]
    .map((path) => relative(ROOT, path))
    .filter(filter)
    .flatMap((file) =>
      find(readFileSync(join(ROOT, file), "utf8")).map(
        (hit) => `${file}:${hit.line} ${hit.value}`,
      ),
    );
}

describe("findCssColourLiterals", () => {
  it("finds hex, colour functions and named colours in values", () => {
    const css = `.a {\n  color: #fff;\n  background: rgb(0 0 0 / 5%);\n  border-color: hsl(10 20% 30%);\n  outline: 1px solid white;\n  box-shadow: 0 0 0 1px color-mix(in srgb, black 10%, transparent);\n}`;
    expect(findCssColourLiterals(css)).toEqual([
      { line: 2, value: "color: #fff" },
      { line: 3, value: "background: rgb(" },
      { line: 4, value: "border-color: hsl(" },
      { line: 5, value: "outline: white" },
      { line: 6, value: "box-shadow: black" },
    ]);
  });
  it("allows keywords, tokens, comments, strings, print and @supports probes", () => {
    const css = `/* was #fff, then white */
.a { color: currentColor; background: transparent; fill: inherit; }
.b { color: var(--ink); font-family: "Red Hat", sans-serif; }
.c { background: color-mix(in oklab, var(--ink) 20%, transparent); }
.d { grid-template-areas: "tan"; animation: fade 1s; }
@supports not (color: light-dark(#000, #fff)) { .e { display: none; } }
@media print { .f { color: #000; background: white; } }`;
    expect(findCssColourLiterals(css)).toEqual([]);
  });
});

describe("findTsxColourLiterals", () => {
  it("finds literal paint in SVG attributes", () => {
    const tsx = `<path fill="#12202c" />\n<line stroke={"red"} />\n<stop stopColor="rgb(1 2 3)" />`;
    expect(findTsxColourLiterals(tsx).map((hit) => hit.line)).toEqual([
      1, 2, 3,
    ]);
  });
  it("allows tokens, currentColor, none and mask luminance", () => {
    const tsx = `<path fill="currentColor" stroke="var(--ink)" />\n<rect fill="none" />\n// fill="#fff" once\n<mask id="m">\n  <rect fill="white" />\n</mask>`;
    expect(findTsxColourLiterals(tsx)).toEqual([]);
  });
});

describe("colour literals in the source", () => {
  it("keeps CSS modules and the card stylesheet on tokens, so both themes reach them", () => {
    const isCardCss = (file: string) =>
      file.startsWith(`${SOCIAL}/`) && file.endsWith(".css");
    expect(
      scan(
        (file) => file.endsWith(".module.css") || isCardCss(file),
        findCssColourLiterals,
      ),
    ).toEqual([]);
  });
  it("keeps SVG paint in TSX on tokens, outside the print tree", () => {
    expect(
      scan(
        (file) => file.endsWith(".tsx") && !PRINT_TSX.test(file),
        findTsxColourLiterals,
      ),
    ).toEqual([]);
  });
});
