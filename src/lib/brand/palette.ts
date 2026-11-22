/** The "Data Desk" palette. `globals.css` mirrors these values as custom properties. */
export const PALETTE = {
  ink: "#1B1A17",
  newsprint: "#F3EEE3",
  card: "#FBF8F2",
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

export const TEXT_PAIRS: {
  name: string;
  fg: string;
  bg: string;
  large?: boolean;
}[] = [
  ...(["ink", "saffronText", "slate", "muted", "mutedSoft"] as const).flatMap(
    (key) =>
      (["newsprint", "card"] as const).map((surface) => ({
        name: `${key} on ${surface}`,
        fg: PALETTE[key],
        bg: PALETTE[surface],
      })),
  ),
  { name: "newsprint on ink", fg: PALETTE.newsprint, bg: PALETTE.ink },
  { name: "card on ink", fg: PALETTE.card, bg: PALETTE.ink },
  ...Object.entries(STATUS).map(([key, { fg, bg }]) => ({
    name: `status ${key}`,
    fg,
    bg,
  })),
  { name: "question line", fg: QUESTION_LINE.fg, bg: QUESTION_LINE.bg },
  ...(["ink", "muted", "green"] as const).flatMap((foreground) =>
    (["paper", "sage"] as const).map((surface) => ({
      name: `shell ${foreground} on ${surface}`,
      fg: SHELL_PALETTE[foreground],
      bg: SHELL_PALETTE[surface],
    })),
  ),
  ...(["paper", "onDark"] as const).map((foreground) => ({
    name: `shell ${foreground} on ink`,
    fg: SHELL_PALETTE[foreground],
    bg: SHELL_PALETTE.ink,
  })),
  ...(["ink", "muted", "green", "error"] as const).flatMap((foreground) =>
    (["paper", "sage", "soft", "greenSoft"] as const).map((surface) => ({
      name: `check ${foreground} on ${surface}`,
      fg: CHECK_PALETTE[foreground],
      bg: CHECK_PALETTE[surface],
    })),
  ),
];

/** Focus ring colours. Dark containers switch to the on-dark ring. */
export const FOCUS_RING = { onLight: "#2E4A7D", onDark: "#F3EEE3" } as const;
