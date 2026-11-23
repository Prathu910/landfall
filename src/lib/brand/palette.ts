/**
 * The MigrateLens colours, light and dark ("passport at night", founder
 * decision 23 Nov 2026). This file holds the light values; their night twins
 * are in `palette-dark.ts` and the contrast pairs in `text-pairs.ts`.
 * `globals.css` mirrors each value as `--token: light-dark(light, dark)`;
 * `palette.test.ts` checks the mirror and the contrast of every text pair in
 * both themes.
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

/** The warm tint behind a "?" line. Distinct from brand saffron. */
export const QUESTION_LINE = { fg: "#1B1A17", bg: "#F6DDB5" } as const;
/** Focus ring colours. Dark containers switch to the on-dark ring. */
export const FOCUS_RING = { onLight: "#2E4A7D", onDark: "#F3EEE3" } as const;
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
