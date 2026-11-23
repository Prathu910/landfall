import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import {
  CHART,
  CHECK_PALETTE,
  DEEP_PANEL,
  FOCUS_RING,
  HOMEPAGE_TEXT,
  INPUT_BORDER,
  LABEL_PAIRS,
  PALETTE,
  QUESTION_LINE,
  SHELL_PALETTE,
  STATUS,
} from "./palette";
import {
  CHART_DARK,
  CHECK_PALETTE_DARK,
  FOCUS_RING_DARK,
  HOMEPAGE_TEXT_DARK,
  LABEL_PAIRS_DARK,
  PALETTE_DARK,
  QUESTION_LINE_DARK,
  SHELL_PALETTE_DARK,
  STATUS_DARK,
} from "./palette-dark";
import { TEXT_PAIRS, TEXT_PAIRS_DARK } from "./text-pairs";
import { lightFallback } from "./light-fallback";
import { LIGHT_DARK_PROBE } from "./theme";

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
const FALLBACK_START = `@supports not (color: ${LIGHT_DARK_PROBE})`;
/** globals.css without the light fallback block at its end. */
const themed = globals.slice(0, globals.indexOf(FALLBACK_START));
/** The declarations of the light fallback block, whitespace normalised. */
const fallback = [
  ...globals
    .slice(globals.indexOf(FALLBACK_START))
    .matchAll(/(--[\w-]+):\s*([^;{}]+);/g),
].map(([, name, value]) => `${name}: ${value.replace(/\s+/g, " ").trim()};`);

/** `#abc` and `#AABBCC` compare equal. */
function normalise(hex: string): string {
  const h = hex.trim().toLowerCase().replace("#", "");
  return `#${h.length === 3 || h.length === 4 ? [...h].map((c) => c + c).join("") : h}`;
}

/** The light and dark values of `--name: light-dark(light, dark)` in globals.css. */
function token(name: string): [string, string] | undefined {
  const match = new RegExp(
    `--${name}:\\s*light-dark\\(\\s*(#[0-9a-f]+)\\s*,\\s*(#[0-9a-f]+)\\s*\\)`,
    "i",
  ).exec(globals);
  return match ? [normalise(match[1]), normalise(match[2])] : undefined;
}

function expectToken(name: string, light: string, dark: string) {
  expect(token(name), name).toEqual([normalise(light), normalise(dark)]);
}

describe("contrastRatio", () => {
  it("measures black on white as 21", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
  });
  it("proves brand saffron cannot be text", () => {
    expect(contrastRatio(PALETTE.saffron, PALETTE.newsprint)).toBeLessThan(4.5);
  });
});

describe("text pairs", () => {
  for (const [theme, pairs] of [
    ["light", TEXT_PAIRS],
    ["dark", TEXT_PAIRS_DARK],
  ] as const) {
    it(`every ${theme} text pair passes AA`, () => {
      for (const pair of pairs) {
        const min = pair.large ? 3 : 4.5;
        expect(
          contrastRatio(pair.fg, pair.bg),
          `${theme}: ${pair.name}`,
        ).toBeGreaterThanOrEqual(min);
      }
    });
  }
  it("covers the palette on both surfaces, reversed text and every status", () => {
    for (const pairs of [TEXT_PAIRS, TEXT_PAIRS_DARK]) {
      const names = pairs.map((p) => p.name);
      for (const key of ["ink", "saffronText", "slate", "muted", "mutedSoft"]) {
        expect(names).toContain(`${key} on newsprint`);
        expect(names).toContain(`${key} on card`);
      }
      expect(names).toContain("newsprint on ink");
      expect(names).toContain("shell paper on deep");
      for (const key of Object.keys(STATUS))
        expect(names).toContain(`status ${key}`);
      expect(names).toContain("question line");
      expect(names).toContain("homepage muted on desk");
    }
  });
  it("gives input borders 3:1 on every input surface in both themes", () => {
    for (const bg of [CHECK_PALETTE.paper, CHECK_PALETTE.soft, PALETTE.card])
      expect(contrastRatio(INPUT_BORDER.light, bg), bg).toBeGreaterThanOrEqual(
        3,
      );
    for (const bg of [
      CHECK_PALETTE_DARK.paper,
      CHECK_PALETTE_DARK.soft,
      PALETTE_DARK.card,
    ])
      expect(contrastRatio(INPUT_BORDER.dark, bg), bg).toBeGreaterThanOrEqual(
        3,
      );
  });
});

describe("globals.css", () => {
  it("mirrors the palette in both themes", () => {
    for (const [key, value] of Object.entries(PALETTE)) {
      expectToken(kebab(key), value, PALETTE_DARK[key as keyof typeof PALETTE]);
    }
    for (const [key, value] of Object.entries(SHELL_PALETTE)) {
      const dark = SHELL_PALETTE_DARK[key as keyof typeof SHELL_PALETTE];
      expectToken(`brand-${kebab(key)}`, value, dark);
    }
    for (const [key, value] of Object.entries(CHECK_PALETTE)) {
      const dark = CHECK_PALETTE_DARK[key as keyof typeof CHECK_PALETTE];
      expectToken(`check-${kebab(key)}`, value, dark);
    }
    for (const [key, value] of Object.entries(HOMEPAGE_TEXT)) {
      const dark = HOMEPAGE_TEXT_DARK[key as keyof typeof HOMEPAGE_TEXT];
      expectToken(`homepage-${kebab(key)}`, value, dark);
    }
    expectToken("input-border", INPUT_BORDER.light, INPUT_BORDER.dark);
  });
  it("mirrors the status colours", () => {
    for (const [key, { fg, bg }] of Object.entries(STATUS)) {
      const dark = STATUS_DARK[key as keyof typeof STATUS];
      expectToken(`status-${kebab(key)}-fg`, fg, dark.fg);
      expectToken(`status-${kebab(key)}-bg`, bg, dark.bg);
    }
    expectToken("question-fg", QUESTION_LINE.fg, QUESTION_LINE_DARK.fg);
    expectToken("question-bg", QUESTION_LINE.bg, QUESTION_LINE_DARK.bg);
  });
  it("gives every colour token a dark value", () => {
    // Plain values switch in the screen-only theme blocks instead.
    const switched = new Set(["--brand-deep"]);
    const declarations = [
      ...themed.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm),
    ].filter(([, , value]) => /#[0-9a-f]{3,8}\b/i.test(value));
    expect(declarations.length).toBeGreaterThan(100);
    for (const [, name, value] of declarations) {
      if (switched.has(name)) continue;
      expect(value, name).toMatch(/light-dark\(/);
    }
  });
  it("gives browsers without light-dark() every token's light value", () => {
    expect(globals.indexOf(FALLBACK_START)).toBeGreaterThan(0);
    expect(globals.trimEnd().endsWith("}")).toBe(true);
    // Regenerate with lightFallback(globals.css) if this fails.
    expect(fallback).toEqual(lightFallback(themed));
    expect(fallback.length).toBeGreaterThan(100);
    expect(fallback).toContain(`--ink: ${PALETTE.ink.toLowerCase()};`);
    expect(globals).toContain(`@supports (color: ${LIGHT_DARK_PROBE}) {`);
    // Light only there, so the appearance control hides too.
    const control = readFileSync(
      "src/components/theme/theme-control.module.css",
      "utf8",
    );
    expect(control).toContain(FALLBACK_START);
  });
  it("deepens the always-dark panels only at night", () => {
    const night = globals.match(/--brand-deep: (#[0-9a-f]+);/gi) ?? [];
    // Once for the reader's choice, once for no-JS visitors on a dark device.
    expect(night).toEqual([
      `--brand-deep: ${DEEP_PANEL.brand.dark.toLowerCase()};`,
      `--brand-deep: ${DEEP_PANEL.brand.dark.toLowerCase()};`,
    ]);
    expect(DEEP_PANEL.ink.dark).toBe(DEEP_PANEL.brand.dark);
  });
  it("keeps print light", () => {
    expect(globals).toMatch(
      /@media print \{\s*:root,\s*:root\[data-mantine-color-scheme\] \{\s*color-scheme: light;/,
    );
  });
  it("names homepage colours by role, not by a light hex", () => {
    // A hex name reads wrong once the token has a dark value.
    expect(globals).not.toMatch(/--homepage-color-/);
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
  it("every dark ink passes AA on its tint, the report sheet and the shell paper", () => {
    for (const [key, { ink, bg }] of Object.entries(LABEL_PAIRS_DARK)) {
      for (const surface of [bg, PALETTE_DARK.card, SHELL_PALETTE_DARK.paper])
        expect(
          contrastRatio(ink, surface),
          `${key} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("mirrors the label tokens and fonts in globals.css", () => {
    for (const [key, { ink, bg }] of Object.entries(LABEL_PAIRS)) {
      const dark = LABEL_PAIRS_DARK[key as keyof typeof LABEL_PAIRS];
      expectToken(`label-${kebab(key)}-ink`, ink, dark.ink);
      expectToken(`label-${kebab(key)}-bg`, bg, dark.bg);
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

describe("chart marks", () => {
  /** The EOI outcome segments in the order a cohort bar draws them. */
  const SEGMENTS = [
    "invited",
    "lodged",
    "submitted",
    "hold",
    "closed",
  ] as const;
  const MARKS = [...SEGMENTS, "maskedA"] as const;
  const THEMES = [
    ["light", CHART, [PALETTE.card, SHELL_PALETTE.paper]],
    ["dark", CHART_DARK, [PALETTE_DARK.card, SHELL_PALETTE_DARK.paper]],
  ] as const;

  for (const [theme, chart, cards] of THEMES) {
    it(`gives every ${theme} mark 3:1 on the cards it sits on`, () => {
      for (const key of MARKS)
        for (const card of cards)
          expect(
            contrastRatio(chart[key], card),
            `${theme} ${key} on ${card}`,
          ).toBeGreaterThanOrEqual(3);
    });
    it(`keeps the ${theme} segments apart and the hatch visible`, () => {
      expect(new Set(SEGMENTS.map((key) => chart[key])).size).toBe(
        SEGMENTS.length,
      );
      for (let index = 1; index < SEGMENTS.length; index++) {
        const pair = `${SEGMENTS[index - 1]}|${SEGMENTS[index]}`;
        expect(
          contrastRatio(chart[SEGMENTS[index - 1]], chart[SEGMENTS[index]]),
          `${theme} ${pair}`,
        ).toBeGreaterThan(1);
      }
      expect(
        contrastRatio(chart.maskedA, chart.maskedB),
        `${theme} hatch`,
      ).toBeGreaterThanOrEqual(3);
    });
  }
  it("lifts the quiet segment to 3:1 on the night card and surface", () => {
    for (const bg of [PALETTE_DARK.card, PALETTE_DARK.surface])
      expect(contrastRatio(CHART_DARK.quiet, bg), bg).toBeGreaterThanOrEqual(3);
  });
  it("mirrors the chart tokens in globals.css", () => {
    for (const [key, value] of Object.entries(CHART)) {
      const dark = CHART_DARK[key as keyof typeof CHART];
      expectToken(`chart-${kebab(key)}`, value, dark);
    }
  });
  it("draws data marks with chart tokens, not hairline or page colours", () => {
    const read = (file: string) =>
      readFileSync(`src/components/${file}.module.css`, "utf8");
    // The hairline and surface tokens vanish on the night card.
    expect(read("occupation/cohort-bars")).not.toMatch(
      /var\(--(brand-[\w-]+|rule|surface)\)/,
    );
    for (const file of ["occupation/cohort-bars", "occupation/pool-tabs"]) {
      const hatches = read(file).match(/repeating-linear-gradient\([^;]+;/g);
      expect(hatches, file).not.toBeNull();
      for (const hatch of hatches ?? []) {
        expect(hatch, file).toContain("var(--chart-masked-a)");
        expect(hatch, file).toContain("var(--chart-masked-b)");
      }
    }
    for (const file of ["report/queue-squares", "report/evidence-tables"])
      expect(read(file), file).not.toMatch(/color-mix\([^;]*--newsprint/);
  });
});

describe("focus rings", () => {
  it("shows on newsprint and card, and on-dark shows on ink, in both themes", () => {
    for (const [ring, palette] of [
      [FOCUS_RING, PALETTE],
      [FOCUS_RING_DARK, PALETTE_DARK],
    ] as const) {
      expect(
        contrastRatio(ring.onLight, palette.newsprint),
      ).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(ring.onLight, palette.card)).toBeGreaterThanOrEqual(
        3,
      );
    }
    expect(
      contrastRatio(FOCUS_RING.onDark, PALETTE.ink),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(FOCUS_RING.onDark, DEEP_PANEL.brand.dark),
    ).toBeGreaterThanOrEqual(3);
  });
  it("needs the override: the light ring is invisible on ink", () => {
    expect(contrastRatio(FOCUS_RING.onLight, PALETTE.ink)).toBeLessThan(3);
  });
  it("mirrors the ring tokens in globals.css", () => {
    expectToken("focus-ring", FOCUS_RING.onLight, FOCUS_RING_DARK.onLight);
    expectToken(
      "focus-ring-on-dark",
      FOCUS_RING.onDark,
      FOCUS_RING_DARK.onDark,
    );
  });
});
