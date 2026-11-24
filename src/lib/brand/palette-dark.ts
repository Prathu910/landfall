/**
 * The night twins of `palette.ts` ("passport at night", 23 Nov 2026): the
 * same roles and keys, each the dark half of a `light-dark()` token.
 */
import type {
  CHART,
  CHECK_PALETTE,
  FOCUS_RING,
  HOMEPAGE_TEXT,
  LABEL_PAIRS,
  PALETTE,
  SHELL_PALETTE,
  STATUS,
} from "./palette";

/** A dark twin has exactly its light palette's keys. */
type Twin<Light, Value> = Record<keyof Light, Value>;

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
} as const satisfies Twin<typeof PALETTE, string>;

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
} as const satisfies Twin<typeof CHECK_PALETTE, string>;

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
} as const satisfies Twin<typeof SHELL_PALETTE, string>;

export const HOMEPAGE_TEXT_DARK = {
  paper: "#14212B",
  desk: "#0E1820",
  ink: "#ECE6D8",
  muted: "#A5B3B9",
  lede: "#DCD6C8",
  answer: "#CFD7D9",
  mapInstruction: "#A8C0B2",
  mapLabel: "#9FB4A9",
  focus: "#93AAFF",
  competitive: "#EBB959",
  strong: "#6FD49C",
  longWait: "#E2B57A",
  notInvited: "#F3958C",
} as const satisfies Twin<typeof HOMEPAGE_TEXT, string>;

export const STATUS_DARK = {
  strongest: { fg: "#A3DAB9", bg: "#16342A" },
  watching: { fg: "#ADC4EE", bg: "#1A2840" },
  needsAnswers: { fg: "#C6BEAE", bg: "#172028" },
  unverified: { fg: "#ADC4EE", bg: "#172028" },
  notOpen: { fg: "#F4A79B", bg: "#3A1C19" },
} as const satisfies Twin<typeof STATUS, { fg: string; bg: string }>;

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
} as const satisfies Twin<typeof LABEL_PAIRS, { ink: string; bg: string }>;

/** Lifted off the night card; lodged is a deeper blue than invited's green, so the two differ in lightness too. */
export const CHART_DARK = {
  invited: "#93C8AA",
  lodged: "#6F9FDC",
  submitted: "#D9973F",
  hold: "#77705F",
  closed: "#C6BEAE",
  maskedA: "#8A9C94",
  maskedB: "#26343D",
  quiet: "#77705F",
} as const satisfies Twin<typeof CHART, string>;

export const QUESTION_LINE_DARK = { fg: "#ECE6D8", bg: "#3B2D17" } as const;

export const FOCUS_RING_DARK = {
  onLight: "#A3BDEB",
  onDark: "#F3EEE3",
} as const satisfies Twin<typeof FOCUS_RING, string>;

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
