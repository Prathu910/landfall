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

/** Report status chips. Every status also shows its label, never colour alone. */
export const STATUS = {
  strongest: { fg: "#1F5136", bg: "#DDEBDF" },
  watching: { fg: "#2E4A7D", bg: "#E4E9F2" },
  needsAnswers: { fg: "#4A463E", bg: "#ECE7DC" },
  unverified: { fg: "#4A463E", bg: "#ECE7DC" },
  notOpen: { fg: "#8A2E22", bg: "#F5DEDA" },
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
];
