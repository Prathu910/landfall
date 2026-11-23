/**
 * The MigrateLens colours, light and dark ("passport at night", founder
 * decision 23 Nov 2026). `globals.css` mirrors each value as
 * `--token: light-dark(light, dark)`; `palette.test.ts` checks the mirror
 * and the contrast of every text pair in both themes.
 */

/** The "Data Desk" palette (the report family). */
export const PALETTE = {
  ink: "#1B1A17",
  newsprint: "#F3EEE3",
  card: "#FBF8F2",
  surface: "#ECE7DC",
  /** Marks, lines and highlights only. It fails contrast as text. */
  saffron: "#D9731A",
  saffronText: "#A04E0C",
  slate: "#2E4A7D",
  muted: "#4A463E",
  mutedSoft: "#6B6558",
  rule: "#DDD4C2",
} as const;

/** The same roles at night: ivory ink on a blue-ink page. */
export const PALETTE_DARK = {
  ink: "#ECE6D8",
  newsprint: "#11191F",
  card: "#172028",
  surface: "#0C141A",
  saffron: "#E58A3A",
  saffronText: "#F0A35E",
  slate: "#A3BDEB",
  muted: "#C6BEAE",
  mutedSoft: "#A69E8F",
  rule: "#2E3A43",
} as const;

/** Approved passport check colours, scoped through --check-* CSS tokens. */
export const CHECK_PALETTE = {
  ink: "#12202c",
  muted: "#52616a",
  sage: "#eef2f0",
  paper: "#ffffff",
  line: "#d5ded8",
  soft: "#f7f9f7",
  green: "#3b6551",
  greenSoft: "#e6eee8",
  focus: "#315c87",
  error: "#b42318",
} as const;

export const CHECK_PALETTE_DARK = {
  ink: "#ECE6D8",
  muted: "#A5B3B9",
  sage: "#0E1820",
  paper: "#14212B",
  line: "#2A3A44",
  soft: "#112029",
  green: "#93C8AA",
  greenSoft: "#18302A",
  focus: "#98BCE6",
  error: "#F68D80",
} as const;

/** Shared shell only; existing page themes retain their own tokens. */
export const SHELL_PALETTE = {
  ink: "#12202c",
  paper: "#ffffff",
  sage: "#eef2f0",
  muted: "#52616a",
  line: "#d5ded8",
  green: "#3b6551",
  onDark: "#c4d0d0",
  darkLine: "#41525b",
  focus: "#315c87",
} as const;

export const SHELL_PALETTE_DARK = {
  ink: "#ECE6D8",
  paper: "#14212B",
  sage: "#0E1820",
  muted: "#A5B3B9",
  line: "#2A3A44",
  green: "#93C8AA",
  onDark: "#B9C7C7",
  darkLine: "#22323C",
  focus: "#98BCE6",
} as const;

/** Homepage text inks (`--homepage-*`), each on the homepage paper and desk. */
export const HOMEPAGE_TEXT = {
  paper: "#ffffff",
  desk: "#eef2f0",
  ink: "#12202c",
  muted: "#52606b",
  color2a3946: "#2a3946",
  color34424e: "#34424e",
  color52665b: "#52665b",
  color5b6c63: "#5b6c63",
  focus: "#2446d6",
  competitive: "#996000",
  strong: "#0f6b3c",
  color815c32: "#815c32",
  colorA23b39: "#a23b39",
} as const;

export const HOMEPAGE_TEXT_DARK = {
  paper: "#14212B",
  desk: "#0E1820",
  ink: "#ECE6D8",
  muted: "#A5B3B9",
  color2a3946: "#DCD6C8",
  color34424e: "#CFD7D9",
  color52665b: "#A8C0B2",
  color5b6c63: "#9FB4A9",
  focus: "#93AAFF",
  competitive: "#EBB959",
  strong: "#6FD49C",
  color815c32: "#E2B57A",
  colorA23b39: "#F3958C",
} as const;

/** Report status chips. Every status also shows its label, never colour alone. */
export const STATUS = {
  strongest: { fg: "#1F5136", bg: "#DDEBDF" },
  watching: { fg: "#2E4A7D", bg: "#E4E9F2" },
  // Both are about missing answers or our own checks, not the user's chances:
  // a light card, never the grey of a dead end (19 Nov 2026).
  needsAnswers: { fg: "#4A463E", bg: "#FBF8F2" },
  unverified: { fg: "#2E4A7D", bg: "#FBF8F2" },
  notOpen: { fg: "#8A2E22", bg: "#F5DEDA" },
} as const;

export const STATUS_DARK = {
  strongest: { fg: "#A3DAB9", bg: "#16342A" },
  watching: { fg: "#ADC4EE", bg: "#1A2840" },
  needsAnswers: { fg: "#C6BEAE", bg: "#172028" },
  unverified: { fg: "#ADC4EE", bg: "#172028" },
  notOpen: { fg: "#F4A79B", bg: "#3A1C19" },
} as const;

/** Outlook label ink and tint pairs (report redesign). Each also shows its label text. */
// Competitive and long wait are darkened from the mockup (#A06400, #C2410C) to reach 4.5:1 on their tints.
export const LABEL_PAIRS = {
  veryStrong: { ink: "#0F6B3C", bg: "#D6EFE0" },
  strong: { ink: "#1E7A4C", bg: "#E5F3EA" },
  competitive: { ink: "#996000", bg: "#FBEFD6" },
  longWait: { ink: "#BE3F0B", bg: "#FDE8DB" },
  notInvited: { ink: "#B42318", bg: "#FCE5E3" },
  notEligible: { ink: "#5B3F9E", bg: "#ECE6F8" },
  notOpen: { ink: "#B42318", bg: "#FCE5E3" },
  noData: { ink: "#586470", bg: "#E8ECEF" },
} as const;

/** Lifted for night: same hue families, so the rank still reads "more ink = stronger". */
export const LABEL_PAIRS_DARK = {
  veryStrong: { ink: "#6FD49C", bg: "#0F2D20" },
  strong: { ink: "#A6D9BB", bg: "#152B22" },
  competitive: { ink: "#EBB959", bg: "#2F2412" },
  longWait: { ink: "#F5965F", bg: "#361D11" },
  notInvited: { ink: "#F68D80", bg: "#381916" },
  notEligible: { ink: "#BEABF3", bg: "#251E3E" },
  notOpen: { ink: "#F68D80", bg: "#381916" },
  noData: { ink: "#B0BCC7", bg: "#1F2931" },
} as const;

/** The warm tint behind a "?" line. Distinct from brand saffron. */
export const QUESTION_LINE = { fg: "#1B1A17", bg: "#F6DDB5" } as const;
export const QUESTION_LINE_DARK = { fg: "#ECE6D8", bg: "#3B2D17" } as const;

/** Focus ring colours. Dark containers switch to the on-dark ring. */
export const FOCUS_RING = { onLight: "#2E4A7D", onDark: "#F3EEE3" } as const;
export const FOCUS_RING_DARK = {
  onLight: "#A3BDEB",
  onDark: "#F3EEE3",
} as const;

/** Form control borders: 3:1 against every input surface (WCAG 1.4.11). */
export const INPUT_BORDER = { light: "#7F918A", dark: "#62757F" } as const;

/**
 * Always-dark panels (site footer, calls to action, report footer). They keep
 * the light design's on-ink text in both themes; by day the panel is its own
 * ink (`light`), at night `--brand-deep` (`dark`).
 */
export const DEEP_PANEL = {
  brand: { light: "#12202C", dark: "#08121A" },
  ink: { light: "#1B1A17", dark: "#08121A" },
} as const;

/** Mantine's `ink` ramp (light, the primary colour): the Data Desk tones. */
export const INK_RAMP = [
  "#FBF8F2",
  "#F3EEE3",
  "#ECE7DC",
  "#DDD4C2",
  "#B9AF9A",
  "#948B77",
  "#6B6558",
  "#4A463E",
  "#2E2C27",
  "#1B1A17",
] as const;

/** Mantine's `dark` ramp: ivory text (0) down to the deep panel (9). */
export const NIGHT_RAMP = [
  "#ECE6D8",
  "#CFD7D9",
  "#A5B3B9",
  "#8A989F",
  "#2A3A44",
  "#22323C",
  "#172028",
  "#14212B",
  "#0E1820",
  "#08121A",
] as const;

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
  "color2a3946",
  "color34424e",
  "color52665b",
  "color5b6c63",
  "focus",
  "competitive",
  "strong",
  "color815c32",
  "colorA23b39",
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
