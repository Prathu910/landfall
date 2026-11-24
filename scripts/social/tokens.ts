/**
 * The Instagram cards' custom properties for one theme, built from the named
 * palette entries (`palette.ts` and its night twins in `palette-dark.ts`), so
 * the cards hold no colour of their own and follow the site in both themes.
 * Each card is rendered in one fixed theme, so a token is a plain value here,
 * never `light-dark()`.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  ARTWORK,
  CHECK_PALETTE,
  HOMEPAGE_TEXT,
  PALETTE,
  SHELL_PALETTE,
  UPDATES_MAP,
} from "../../src/lib/brand/palette";
import {
  ARTWORK_DARK,
  CHECK_PALETTE_DARK,
  HOMEPAGE_TEXT_DARK,
  PALETTE_DARK,
  SHELL_PALETTE_DARK,
  UPDATES_MAP_DARK,
} from "../../src/lib/brand/palette-dark";

export type Theme = "light" | "dark";

const ROOT = resolve(__dirname, "..", "..");

/**
 * The page's guilloche artwork, the site's own (`public/`), inlined: Chrome
 * treats a `file://` mask image as cross-origin and drops it, which would
 * lose the night linework.
 */
const GUILLOCHE_URL = `data:image/svg+xml;base64,${readFileSync(
  join(ROOT, "public", "report-passport-a.svg"),
).toString("base64")}`;

type Pair = readonly [light: string, dark: string];

/** Card colour roles, each a palette entry and its night twin. */
const COLOURS: Record<string, Pair> = {
  desk: [SHELL_PALETTE.sage, SHELL_PALETTE_DARK.sage],
  paper: [SHELL_PALETTE.paper, SHELL_PALETTE_DARK.paper],
  "paper-soft": [CHECK_PALETTE.soft, CHECK_PALETTE_DARK.soft],
  ink: [SHELL_PALETTE.ink, SHELL_PALETTE_DARK.ink],
  lede: [HOMEPAGE_TEXT.lede, HOMEPAGE_TEXT_DARK.lede],
  muted: [SHELL_PALETTE.muted, SHELL_PALETTE_DARK.muted],
  line: [SHELL_PALETTE.line, SHELL_PALETTE_DARK.line],
  rule: [ARTWORK.rule, ARTWORK_DARK.rule],
  green: [SHELL_PALETTE.green, SHELL_PALETTE_DARK.green],
  /** Marks and lines only, never text. */
  saffron: [PALETTE.saffron, PALETTE_DARK.saffron],
  "map-1": [UPDATES_MAP[0], UPDATES_MAP_DARK[0]],
  "map-2": [UPDATES_MAP[1], UPDATES_MAP_DARK[1]],
  "map-3": [UPDATES_MAP[2], UPDATES_MAP_DARK[2]],
  "map-4": [UPDATES_MAP[3], UPDATES_MAP_DARK[3]],
  "map-edge": [ARTWORK.mapEdge, ARTWORK_DARK.mapEdge],
  "map-edge-strong": [ARTWORK.mapEdgeStrong, ARTWORK_DARK.mapEdgeStrong],
  "map-shade-1": [ARTWORK.mapShade1, ARTWORK_DARK.mapShade1],
  "map-shade-2": [ARTWORK.mapShade2, ARTWORK_DARK.mapShade2],
  "map-shade-3": [ARTWORK.mapShade3, ARTWORK_DARK.mapShade3],
  "map-shadow": [ARTWORK.mapShadow, ARTWORK_DARK.mapShadow],
  "guill-a": [ARTWORK.guillocheA, ARTWORK_DARK.guillocheA],
  "guill-b": [ARTWORK.guillocheB, ARTWORK_DARK.guillocheB],
};

const guilloche = `url("${GUILLOCHE_URL}") center / cover no-repeat`;

/** Fonts and the site's non-colour theme switches (globals.css). */
const SWITCHES: Record<string, Pair> = {
  font: [`"Archivo", sans-serif`, `"Archivo", sans-serif`],
  "font-stamp": [
    `"Big Shoulders Stencil Display", "Archivo", sans-serif`,
    `"Big Shoulders Stencil Display", "Archivo", sans-serif`,
  ],
  "page-shadow": [
    "color-mix(in srgb, var(--ink) 33%, transparent)",
    "color-mix(in srgb, var(--map-shadow) 67%, transparent)",
  ],
  // By day the artwork as drawn; at night the same lines as a mask over the
  // guilloche gradient, as the site's `.guill-layer`.
  "guill-paint": [
    guilloche,
    "linear-gradient(125deg, var(--guill-a) 35%, var(--guill-b))",
  ],
  "guill-mask": ["none", guilloche],
  "guill-opacity": ["0.9", "0.27"],
  "stamp-glow": [
    "none",
    "drop-shadow(0 0 6px color-mix(in srgb, currentColor 45%, transparent))",
  ],
};

/** `:root{color-scheme:…;--paper:…}` for one theme. */
export function cardTokenCss(theme: Theme): string {
  const side = theme === "light" ? 0 : 1;
  const declarations = Object.entries({ ...COLOURS, ...SWITCHES }).map(
    ([name, pair]) => `--${name}:${pair[side]};`,
  );
  return `:root{color-scheme:${theme};${declarations.join("")}}`;
}
