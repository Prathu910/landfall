import styles from "./logo.module.css";
import {
  FAVICON_MARK,
  MARK_BARS,
  MARK_COLOURS,
  MARK_RING,
} from "./mark-geometry";

export { FAVICON_MARK, MARK_BARS, MARK_COLOURS, MARK_RING };

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
