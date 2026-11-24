/**
 * Every text-on-surface pairing the site uses, built for each theme so
 * `palette.test.ts` can check WCAG AA contrast in light and dark.
 */
import {
  CHECK_PALETTE,
  DEEP_PANEL,
  HOMEPAGE_TEXT,
  PALETTE,
  QUESTION_LINE,
  SHELL_PALETTE,
  STATUS,
} from "./palette";
import {
  CHECK_PALETTE_DARK,
  HOMEPAGE_TEXT_DARK,
  PALETTE_DARK,
  QUESTION_LINE_DARK,
  SHELL_PALETTE_DARK,
  STATUS_DARK,
} from "./palette-dark";

export type TextPair = {
  name: string;
  fg: string;
  bg: string;
  large?: boolean;
};

type Theme = {
  palette: Record<keyof typeof PALETTE, string>;
  check: Record<keyof typeof CHECK_PALETTE, string>;
  shell: Record<keyof typeof SHELL_PALETTE, string>;
  homepage: Record<keyof typeof HOMEPAGE_TEXT, string>;
  status: Record<keyof typeof STATUS, { fg: string; bg: string }>;
  question: { fg: string; bg: string };
  deep: { brand: string; ink: string };
};

const HOMEPAGE_INKS = [
  "ink",
  "muted",
  "lede",
  "answer",
  "mapInstruction",
  "mapLabel",
  "focus",
  "competitive",
  "strong",
  "longWait",
  "notInvited",
] as const;

function textPairs(theme: Theme): TextPair[] {
  const { palette, check, shell, homepage } = theme;
  return [
    ...(["ink", "saffronText", "slate", "muted", "mutedSoft"] as const).flatMap(
      (key) =>
        (["newsprint", "card"] as const).map((surface) => ({
          name: `${key} on ${surface}`,
          fg: palette[key],
          bg: palette[surface],
        })),
    ),
    { name: "newsprint on ink", fg: palette.newsprint, bg: palette.ink },
    { name: "card on ink", fg: palette.card, bg: palette.ink },
    ...Object.entries(theme.status).map(([key, { fg, bg }]) => ({
      name: `status ${key}`,
      fg,
      bg,
    })),
    { name: "question line", fg: theme.question.fg, bg: theme.question.bg },
    ...(["ink", "muted", "green"] as const).flatMap((foreground) =>
      (["paper", "sage"] as const).map((surface) => ({
        name: `shell ${foreground} on ${surface}`,
        fg: shell[foreground],
        bg: shell[surface],
      })),
    ),
    // Deep panels keep the light design's text (color-scheme: light inside).
    ...(["paper", "onDark"] as const).map((foreground) => ({
      name: `shell ${foreground} on deep`,
      fg: SHELL_PALETTE[foreground],
      bg: theme.deep.brand,
    })),
    { name: "card on ink deep", fg: PALETTE.card, bg: theme.deep.ink },
    {
      name: "muted on-dark on ink deep",
      fg: "#D6CFBF",
      bg: theme.deep.ink,
    },
    ...(["ink", "muted", "green", "error"] as const).flatMap((foreground) =>
      (["paper", "sage", "soft", "greenSoft"] as const).map((surface) => ({
        name: `check ${foreground} on ${surface}`,
        fg: check[foreground],
        bg: check[surface],
      })),
    ),
    ...HOMEPAGE_INKS.flatMap((foreground) =>
      (["paper", "desk"] as const).map((surface) => ({
        name: `homepage ${foreground} on ${surface}`,
        fg: homepage[foreground],
        bg: homepage[surface],
      })),
    ),
  ];
}

export const TEXT_PAIRS = textPairs({
  palette: PALETTE,
  check: CHECK_PALETTE,
  shell: SHELL_PALETTE,
  homepage: HOMEPAGE_TEXT,
  status: STATUS,
  question: QUESTION_LINE,
  deep: { brand: DEEP_PANEL.brand.light, ink: DEEP_PANEL.ink.light },
});

export const TEXT_PAIRS_DARK = textPairs({
  palette: PALETTE_DARK,
  check: CHECK_PALETTE_DARK,
  shell: SHELL_PALETTE_DARK,
  homepage: HOMEPAGE_TEXT_DARK,
  status: STATUS_DARK,
  question: QUESTION_LINE_DARK,
  deep: { brand: DEEP_PANEL.brand.dark, ink: DEEP_PANEL.ink.dark },
});
