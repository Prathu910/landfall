// Pure geometry for the logo mark. No CSS imports, so scripts can use it.

export const MARK_COLOURS = {
  ink: "#1B1A17",
  reversed: "#F3EEE3",
  accent: "#D9731A",
} as const;

export const MARK_RING = { cx: 24, cy: 24, r: 18, strokeWidth: 3.5 } as const;

/** Three bars, bottom-aligned at y=33. The tallest is the saffron accent. */
export const MARK_BARS = [
  { x: 15, y: 25, width: 4.5, height: 8, accent: false },
  { x: 21.75, y: 20, width: 4.5, height: 13, accent: false },
  { x: 28.5, y: 15, width: 4.5, height: 18, accent: true },
] as const;

/** Heavier ring and square bars so the mark holds up at 16 and 24px. */
export const FAVICON_MARK = {
  ring: { ...MARK_RING, strokeWidth: 5 },
  bars: [
    { x: 14, y: 24, width: 6, height: 10, accent: false },
    { x: 21, y: 19, width: 6, height: 15, accent: false },
    { x: 28, y: 14, width: 6, height: 20, accent: true },
  ],
} as const;
