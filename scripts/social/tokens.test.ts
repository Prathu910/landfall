import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHELL_PALETTE } from "../../src/lib/brand/palette";
import { SHELL_PALETTE_DARK } from "../../src/lib/brand/palette-dark";
import { monthSetCards, roundSetCards } from "../../src/lib/updates/cards";
import { loadRecap } from "../../src/lib/updates/load-server";
import { cardHtml } from "./html";
import { cardColour, cardTokenCss } from "./tokens";

const THEMES = ["light", "dark"] as const;
const FORMATS = ["feed", "story", "og"] as const;
const oct = loadRecap("2026-10");
const cards = [...monthSetCards(oct), ...roundSetCards(oct, "2026-10-15")];

const varNames = (text: string) =>
  new Set([...text.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
const declared = (css: string) =>
  [...css.matchAll(/(--[\w-]+):/g)].map((m) => m[1]);
/** A launch chart bar's own sizes, set inline on each bar (launch-chart.tsx). */
const BAR_VARS = ["--solid", "--hatched"];

describe("cardTokenCss", () => {
  it("defines every var() card.css, launch.css and reel.css use, in both themes", () => {
    for (const file of ["card.css", "launch.css", "reel.css"]) {
      const css = readFileSync(`scripts/social/${file}`, "utf8");
      // A chart's bar sizes are the stylesheet's own (set inline per bar).
      const local = new Set([...declared(css), ...BAR_VARS]);
      const used = [...varNames(css)].filter((name) => !local.has(name));
      expect(used.length).toBeGreaterThan(5);
      for (const theme of THEMES)
        for (const name of used)
          expect(cardTokenCss(theme), `${file} ${theme} ${name}`).toContain(
            `${name}:`,
          );
    }
  });

  // R14: the stamps and the map paint through inline SVG attributes.
  it("defines every var() a rendered card uses, in both themes", () => {
    for (const card of cards)
      for (const format of FORMATS)
        for (const theme of THEMES) {
          const html = cardHtml(card, format, theme);
          // Tokens, or the cards' own layout variables (launch.css charts).
          const defined = new Set([
            ...declared(cardTokenCss(theme)),
            ...declared(html),
            ...BAR_VARS,
          ]);
          for (const name of varNames(html))
            expect(
              defined.has(name),
              `${card.id} ${format} ${theme} ${name}`,
            ).toBe(true);
        }
  });

  it("gives both themes the same tokens and its own colour scheme", () => {
    expect(declared(cardTokenCss("dark"))).toEqual(
      declared(cardTokenCss("light")),
    );
    expect(cardTokenCss("light")).toMatch(/^:root\{color-scheme:light;/);
    expect(cardTokenCss("dark")).toMatch(/^:root\{color-scheme:dark;/);
  });

  it("takes its colours from the palette and its night twin", () => {
    expect(cardTokenCss("light")).toContain(`--paper:${SHELL_PALETTE.paper};`);
    expect(cardTokenCss("dark")).toContain(
      `--paper:${SHELL_PALETTE_DARK.paper};`,
    );
    expect(cardTokenCss("dark")).toContain(`--ink:${SHELL_PALETTE_DARK.ink};`);
  });
});

describe("cardColour", () => {
  it("reads one role in one theme", () => {
    expect(cardColour("paper", "light")).toBe(SHELL_PALETTE.paper);
    expect(cardColour("paper", "dark")).toBe(SHELL_PALETTE_DARK.paper);
    expect(() => cardColour("nonsense", "dark")).toThrow(
      "No card colour --nonsense",
    );
  });
});
