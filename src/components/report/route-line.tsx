import {
  deadlineLines,
  deadlinePosition,
  deadlineTiers,
  routeAria,
  stepX,
  wrapText,
} from "@/lib/outlook/route-geometry";
import type { Route } from "@/lib/outlook/route";
import { labelInk } from "./label-ink";
import styles from "./route-line.module.css";

type Props = { route: Route; width?: number };

// Text is 14 units or more so it renders at 12px or more when the 860-unit
// chart is squeezed into a 760px container.
const FLAG_WIDTH = 196;
const FLAG_HEIGHT = 46;
const TIER_STEP = FLAG_HEIGHT + 6;
const TITLE_LINE = 19;
const SUB_LINE = 17;
const BOTTOM_PAD = 14;

export function RouteLine({ route, width = 860 }: Props) {
  const count = route.steps.length;
  const margin = width < 800 ? 80 : 100;
  const x = (position: number) => stepX(position, count, width, margin);
  const spacing = count > 1 ? (width - 2 * margin) / (count - 1) : width;
  const wrapChars = Math.max(10, Math.floor(spacing / 9));

  const flags = route.deadlines.map((deadline) => ({
    deadline,
    x: x(deadlinePosition(deadline, count)),
  }));
  const tiers = deadlineTiers(
    flags.map((flag) => flag.x),
    FLAG_WIDTH,
  );
  const tierCount = flags.length ? Math.max(...tiers) + 1 : 0;
  const axisY = 28 + tierCount * TIER_STEP + (tierCount ? 18 : 0);

  const steps = route.steps.map((step) => ({
    step,
    title: wrapText(step.title, wrapChars),
    sub: wrapText(step.sub, wrapChars + 4),
  }));
  const textHeight = Math.max(
    ...steps.map(
      (s) => s.title.length * TITLE_LINE + s.sub.length * SUB_LINE + 6,
    ),
  );
  const height = axisY + 44 + textHeight + BOTTOM_PAD;

  return (
    <svg
      className={styles.line}
      style={{ maxWidth: width }}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={routeAria(route)}
    >
      <line
        className={styles.track}
        x1={x(0)}
        x2={x(count - 1)}
        y1={axisY}
        y2={axisY}
      />
      <line
        className={styles.dots}
        x1={x(0)}
        x2={x(count - 1)}
        y1={axisY}
        y2={axisY}
      />
      {flags.map(({ deadline, x: dx }, i) => (
        <line
          key={`stem-${deadline.afterStep}-${deadline.title}`}
          className={styles.stem}
          x1={dx}
          x2={dx}
          y1={4 + (tierCount - 1 - tiers[i]) * TIER_STEP + FLAG_HEIGHT}
          y2={axisY + 10}
        />
      ))}
      {flags.map(({ deadline, x: dx }, i) => {
        const [name, date] = deadlineLines(deadline);
        const top = 4 + (tierCount - 1 - tiers[i]) * TIER_STEP;
        return (
          <g
            key={`${deadline.afterStep}-${deadline.title}`}
            className={styles.deadline}
          >
            <rect
              x={dx - FLAG_WIDTH / 2}
              y={top}
              width={FLAG_WIDTH}
              height={FLAG_HEIGHT}
              rx={8}
            />
            <text
              x={dx}
              y={top + 19}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
            >
              {name}
            </text>
            <text x={dx} y={top + 38} textAnchor="middle" fontSize={14}>
              {date}
            </text>
          </g>
        );
      })}
      {steps.map(({ step, title, sub }, i) => {
        const cx = x(i);
        const titleTop = axisY + 46;
        const subTop =
          titleTop + (title.length - 1) * TITLE_LINE + SUB_LINE + 4;
        return (
          <g key={`${i}-${step.title}`} style={{ color: labelInk(step.label) }}>
            {step.points === null ? (
              <circle className={styles.hollow} cx={cx} cy={axisY} r={10} />
            ) : (
              <>
                <circle className={styles.solid} cx={cx} cy={axisY} r={20} />
                <text
                  className={styles.points}
                  x={cx}
                  y={axisY + 5.5}
                  textAnchor="middle"
                  fontSize={16}
                  fontWeight={800}
                >
                  {step.points}
                </text>
              </>
            )}
            <text
              className={styles.title}
              x={cx}
              y={titleTop}
              textAnchor="middle"
              fontSize={16}
              fontWeight={700}
            >
              {title.map((line, row) => (
                <tspan key={row} x={cx} dy={row === 0 ? 0 : TITLE_LINE}>
                  {line}
                </tspan>
              ))}
            </text>
            <text
              className={styles.sub}
              x={cx}
              y={subTop}
              textAnchor="middle"
              fontSize={14}
            >
              {sub.map((line, row) => (
                <tspan key={row} x={cx} dy={row === 0 ? 0 : SUB_LINE}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
