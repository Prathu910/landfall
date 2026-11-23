import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import {
  CHECK_PALETTE,
  SHELL_PALETTE,
  FOCUS_RING,
  LABEL_PAIRS,
  PALETTE,
  QUESTION_LINE,
  STATUS,
  TEXT_PAIRS,
} from "./palette";

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return cssFiles(path);
    return path.endsWith(".css") ? [path] : [];
  });
}

const globals = readFileSync("src/app/globals.css", "utf8");
const hasLabelToken = (name: string, value: string) =>
  new RegExp(`--label-${name}:\\s*${value}\\b`, "i").test(globals);

describe("contrastRatio", () => {
  it("measures black on white as 21", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });
  it("proves brand saffron cannot be text", () => {
    expect(contrastRatio(PALETTE.saffron, PALETTE.newsprint)).toBeLessThan(4.5);
  });
});

describe("text pairs", () => {
  it("every text pair passes AA", () => {
    for (const pair of TEXT_PAIRS) {
      const min = pair.large ? 3 : 4.5;
      expect(contrastRatio(pair.fg, pair.bg), pair.name).toBeGreaterThanOrEqual(
        min,
      );
    }
  });
  it("covers the palette on both surfaces, reversed text and every status", () => {
    const names = TEXT_PAIRS.map((p) => p.name);
    for (const key of ["ink", "saffronText", "slate", "muted", "mutedSoft"]) {
      expect(names).toContain(`${key} on newsprint`);
      expect(names).toContain(`${key} on card`);
    }
    expect(names).toContain("newsprint on ink");
    for (const key of Object.keys(STATUS))
      expect(names).toContain(`status ${key}`);
    expect(names).toContain("question line");
  });
});

describe("globals.css", () => {
  const hasToken = (name: string, value: string) =>
    new RegExp(`--${name}:\\s*${value}\\b`, "i").test(globals);
  it("mirrors the palette", () => {
    for (const [key, value] of Object.entries(PALETTE)) {
      expect(hasToken(kebab(key), value), key).toBe(true);
    }
    for (const [key, value] of Object.entries(SHELL_PALETTE)) {
      expect(hasToken(`brand-${kebab(key)}`, value), key).toBe(true);
    }
    for (const [key, value] of Object.entries(CHECK_PALETTE)) {
      expect(hasToken(`check-${kebab(key)}`, value), key).toBe(true);
    }
  });
  it("mirrors the status colours", () => {
    for (const [key, { fg, bg }] of Object.entries(STATUS)) {
      expect(hasToken(`status-${kebab(key)}-fg`, fg), key).toBe(true);
      expect(hasToken(`status-${kebab(key)}-bg`, bg), key).toBe(true);
    }
    expect(hasToken("question-fg", QUESTION_LINE.fg)).toBe(true);
    expect(hasToken("question-bg", QUESTION_LINE.bg)).toBe(true);
  });
  it("leaves no old palette behind", () => {
    const old =
      /#127b61|#102e29|#c7f5d9|#edf4ee|#f7f9f5|DM Sans|Instrument Serif/i;
    for (const file of cssFiles("src")) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(old);
    }
  });
});

describe("outlook label pairs", () => {
  it("every ink passes AA on its tint and on white", () => {
    for (const [key, { ink, bg }] of Object.entries(LABEL_PAIRS)) {
      expect(contrastRatio(ink, bg), `${key} on bg`).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrastRatio(ink, "#FFFFFF"),
        `${key} on white`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("mirrors the label tokens and fonts in globals.css", () => {
    for (const [key, { ink, bg }] of Object.entries(LABEL_PAIRS)) {
      expect(hasLabelToken(`${kebab(key)}-ink`, ink), key).toBe(true);
      expect(hasLabelToken(`${kebab(key)}-bg`, bg), key).toBe(true);
    }
    expect(globals).toMatch(/--font-report:[^;]*Archivo Variable/);
    // Founder decision, 23 Nov 2026 (supersedes R22): every stamp, on the
    // homepage and in the report, uses the self-hosted stencil face.
    expect(globals).toMatch(/--font-stamp:\s*"Big Shoulders Stencil Display"/);
  });
  it("loads the stencil face once, from @fontsource, for every stamp", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toMatch(
      /@fontsource\/big-shoulders-stencil-display\/latin-900/,
    );
    const css = cssFiles("src")
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(css).not.toMatch(/Homepage Stencil|big-shoulders-stencil\.ttf/);
  });
});

describe("focus rings", () => {
  it("shows on newsprint and card, and on-dark shows on ink", () => {
    expect(
      contrastRatio(FOCUS_RING.onLight, PALETTE.newsprint),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(FOCUS_RING.onLight, PALETTE.card),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(FOCUS_RING.onDark, PALETTE.ink),
    ).toBeGreaterThanOrEqual(3);
  });
  it("needs the override: the light ring is invisible on ink", () => {
    expect(contrastRatio(FOCUS_RING.onLight, PALETTE.ink)).toBeLessThan(3);
  });
  it("mirrors the ring tokens in globals.css", () => {
    expect(globals).toMatch(
      new RegExp(`--focus-ring:\\s*${FOCUS_RING.onLight}`, "i"),
    );
    expect(globals).toMatch(
      new RegExp(`--focus-ring-on-dark:\\s*${FOCUS_RING.onDark}`, "i"),
    );
  });
});
