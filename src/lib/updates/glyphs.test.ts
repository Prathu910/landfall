import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import { cardStrings, monthSetCards, roundSetCards } from "./cards";
import { charsOutside, parseUnicodeRange } from "./glyphs";
import { listRecapMonths, loadRecap } from "./load-server";
import type { RecapFacts } from "./types";

function css(...parts: string[]): string {
  return readFileSync(
    path.join(process.cwd(), "node_modules", ...parts),
    "utf8",
  );
}

/** The `unicode-range` of the face whose file is the plain latin subset. */
function latinRanges(source: string, file: string) {
  const block = source
    .split("@font-face")
    .find((b) => b.includes(`${file}.woff2`));
  if (!block) throw new Error(`No @font-face for ${file}`);
  return parseUnicodeRange(block);
}

const ARCHIVO = latinRanges(
  css("@fontsource-variable", "archivo", "wdth.css"),
  "archivo-latin-wdth-normal",
);
const STENCIL = latinRanges(
  css("@fontsource", "big-shoulders-stencil-display", "900.css"),
  "big-shoulders-stencil-display-latin-900-normal",
);

describe("parseUnicodeRange and charsOutside", () => {
  it("reads single code points and ranges", () => {
    expect(parseUnicodeRange("unicode-range: U+0041-005A,U+00D7;")).toEqual([
      [0x41, 0x5a],
      [0xd7, 0xd7],
    ]);
  });

  it("lists characters no range covers", () => {
    const ranges = parseUnicodeRange("unicode-range: U+0020-007E,U+00B7;");
    expect(charsOutside("A · →B→", ranges)).toEqual(["→"]);
  });

  it("finds both fonts' latin ranges", () => {
    expect(ARCHIVO.length).toBeGreaterThan(0);
    expect(STENCIL.length).toBeGreaterThan(0);
  });
});

const FILES: [string, RecapFacts][] = [
  ...listRecapMonths().map((m): [string, RecapFacts] => [m, loadRecap(m)]),
  ["round-only fixture", roundOnly],
  ["data-only fixture", dataOnly],
  ["two-rounds fixture", twoRounds],
];

describe("card copy stays inside the bundled fonts", () => {
  it.each(FILES)("%s", (_name, facts) => {
    const cards = [
      ...(facts.data ? monthSetCards(facts) : []),
      ...Object.keys(facts.rounds).flatMap((d) => roundSetCards(facts, d)),
    ];
    for (const card of cards) {
      const text = cardStrings(card).join("");
      expect(charsOutside(text, ARCHIVO), `${card.id} (Archivo)`).toEqual([]);
      expect(charsOutside(text, STENCIL), `${card.id} (stencil)`).toEqual([]);
    }
  });
});
