import {
  deadlineLines,
  deadlinePosition,
  routeAria,
  stepX,
  wrapText,
} from "@/lib/outlook/route-geometry";
import type { Route } from "@/lib/outlook/route";
import { labelInk } from "./label-ink";
import styles from "./route-line.module.css";

type Props = { route: Route; width?: number };

const AXIS_Y = 96;
const HEIGHT = 230;
const FLAG_WIDTH = 176;

export function RouteLine({ route, width = 860 }: Props) {
  const count = route.steps.length;
  const margin = width < 800 ? 70 : 90;
  const x = (position: number) => stepX(position, count, width, margin);
  const spacing = count > 1 ? (width - 2 * margin) / (count - 1) : width;
  const wrapChars = Math.max(10, Math.floor(spacing / 8));

  return (
    <svg
      className={styles.line}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={routeAria(route)}
    >
      <line
        className={styles.track}
        x1={x(0)}
        x2={x(count - 1)}
        y1={AXIS_Y}
        y2={AXIS_Y}
      />
      <line
        className={styles.dots}
        x1={x(0)}
        x2={x(count - 1)}
        y1={AXIS_Y}
        y2={AXIS_Y}
      />
      {route.deadlines.map((deadline) => {
        const dx = x(deadlinePosition(deadline, count));
        const [name, date] = deadlineLines(deadline);
        return (
          <g
            key={`${deadline.afterStep}-${deadline.title}`}
            className={styles.deadline}
          >
            <line x1={dx} x2={dx} y1={34} y2={AXIS_Y + 10} />
            <rect
              x={dx - FLAG_WIDTH / 2}
              y={4}
              width={FLAG_WIDTH}
              height={44}
              rx={8}
            />
            <text
              x={dx}
              y={22}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
            >
              {name}
            </text>
            <text x={dx} y={39} textAnchor="middle" fontSize={12.5}>
              {date}
            </text>
          </g>
        );
      })}
      {route.steps.map((step, i) => {
        const cx = x(i);
        const ink = labelInk(step.label);
        return (
          <g key={`${i}-${step.title}`} style={{ color: ink }}>
            {step.points === null ? (
              <circle className={styles.hollow} cx={cx} cy={AXIS_Y} r={10} />
            ) : (
              <>
                <circle className={styles.solid} cx={cx} cy={AXIS_Y} r={19} />
                <text
                  className={styles.points}
                  x={cx}
                  y={AXIS_Y + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={800}
                >
                  {step.points}
                </text>
              </>
            )}
            <text
              className={styles.title}
              x={cx}
              y={AXIS_Y + 44}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
            >
              {wrapText(step.title, wrapChars).map((line, row) => (
                <tspan key={row} x={cx} dy={row === 0 ? 0 : 17}>
                  {line}
                </tspan>
              ))}
            </text>
            <text
              className={styles.sub}
              x={cx}
              y={AXIS_Y + 44 + 17 * wrapText(step.title, wrapChars).length + 2}
              textAnchor="middle"
              fontSize={13}
            >
              {wrapText(step.sub, wrapChars + 4).map((line, row) => (
                <tspan key={row} x={cx} dy={row === 0 ? 0 : 16}>
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
