import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHELL_PALETTE } from "../../src/lib/brand/palette";
import { SHELL_PALETTE_DARK } from "../../src/lib/brand/palette-dark";
import { monthSetCards, roundSetCards } from "../../src/lib/updates/cards";
import { loadRecap } from "../../src/lib/updates/load-server";
import { cardHtml } from "./html";
import { cardTokenCss } from "./tokens";

const THEMES = ["light", "dark"] as const;
const FORMATS = ["feed", "story", "og"] as const;
const oct = loadRecap("2026-10");
const cards = [...monthSetCards(oct), ...roundSetCards(oct, "2026-10-15")];

const varNames = (text: string) =>
  new Set([...text.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
const declared = (css: string) =>
  [...css.matchAll(/(--[\w-]+):/g)].map((m) => m[1]);

describe("cardTokenCss", () => {
  it("defines every var() card.css uses, in both themes", () => {
    const used = varNames(readFileSync("scripts/social/card.css", "utf8"));
    expect(used.size).toBeGreaterThan(10);
    for (const theme of THEMES)
      for (const name of used)
        expect(cardTokenCss(theme), `${theme} ${name}`).toContain(`${name}:`);
  });

  // R14: the stamps and the map paint through inline SVG attributes.
  it("defines every var() a rendered card uses, in both themes", () => {
    for (const card of cards)
      for (const format of FORMATS)
        for (const theme of THEMES) {
          const tokens = cardTokenCss(theme);
          for (const name of varNames(cardHtml(card, format, theme)))
            expect(tokens, `${card.id} ${format} ${theme} ${name}`).toContain(
              `${name}:`,
            );
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
