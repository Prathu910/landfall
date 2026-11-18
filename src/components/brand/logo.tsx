import styles from "./logo.module.css";

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

export function LogoMark({
  size = 32,
  reversed = false,
  title,
}: {
  size?: number;
  reversed?: boolean;
  title?: string;
}) {
  const base = reversed ? MARK_COLOURS.reversed : MARK_COLOURS.ink;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <circle
        cx={MARK_RING.cx}
        cy={MARK_RING.cy}
        r={MARK_RING.r}
        fill="none"
        stroke={base}
        strokeWidth={MARK_RING.strokeWidth}
      />
      {MARK_BARS.map((bar) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          rx={1}
          fill={bar.accent ? MARK_COLOURS.accent : base}
        />
      ))}
    </svg>
  );
}

export function Logo({ reversed = false }: { reversed?: boolean }) {
  return (
    <span className={`${styles.logo} ${reversed ? styles.reversed : ""}`}>
      <LogoMark size={36} reversed={reversed} />
      <span className={styles.wordmark}>MigrateLens</span>
    </span>
  );
}
