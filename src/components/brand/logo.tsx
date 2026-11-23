import styles from "./logo.module.css";
import {
  MARK_COLOURS,
  MARK_PATHS,
  MARK_STROKE,
  MARK_VIEWBOX,
} from "./mark-geometry";

export function LogoMark({
  size = 32,
  reversed = false,
  title,
}: {
  size?: number;
  reversed?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <g
        fill="none"
        // The lockup sets the colour, so the mark turns ivory at night.
        stroke={reversed ? MARK_COLOURS.reversed : "currentColor"}
        strokeWidth={MARK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

export function Logo({ reversed = false }: { reversed?: boolean }) {
  return (
    <span className={`${styles.logo} ${reversed ? styles.reversed : ""}`}>
      <LogoMark size={36} reversed={reversed} />
      <span className={styles.wordmark}>
        Migrate<span className={styles.lens}>Lens</span>
      </span>
    </span>
  );
}
