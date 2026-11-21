import type { CutoffColumns as CutoffData } from "@/lib/outlook/charts";
import styles from "./cutoff-columns.module.css";

const HEIGHT = 230;
const TOP = 34;
const BASE = 196;
const NOT_LISTED_HEIGHT = 46;

type Props = { data: CutoffData; narrow?: boolean };

type Scale = { low: number; high: number };

function scaleOf(data: CutoffData): Scale {
  const values = [
    data.you,
    data.target?.points ?? data.you,
    data.pass ?? data.you,
  ];
  for (const column of data.columns) {
    if (column.cutoff !== null) values.push(column.cutoff);
  }
  return {
    low: Math.floor((Math.min(...values) - 10) / 5) * 5,
    high: Math.ceil((Math.max(...values) + 5) / 5) * 5,
  };
}

function CutoffChart({ data, narrow = false }: Props) {
  const width = narrow ? 340 : 400;
  // Narrow charts draw at 340 units with larger text so a 360px phone
  // still renders every label at 12px or more.
  const small = narrow ? 13.5 : 13;
  const big = narrow ? 15 : 14;
  const right = width - 8;
  const { low, high } = scaleOf(data);
  const y = (value: number) =>
    BASE - ((value - low) / (high - low)) * (BASE - TOP);
  // Labels within 5 points would overprint, so the lower line labels below.
  const close =
    data.target !== null && Math.abs(data.target.points - data.you) <= 5;
  const count = data.columns.length;
  const barWidth = narrow ? 36 : 38;
  const gap = (right - 20 - count * barWidth) / (count - 1 || 1);

  const guide = (
    value: number,
    label: string,
    className: string,
    dashed: boolean,
    side: "start" | "end",
    below = false,
  ) => (
    <g className={className}>
      <line
        x1={14}
        x2={right}
        y1={y(value)}
        y2={y(value)}
        strokeWidth={dashed ? 2 : 3}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text
        x={side === "start" ? 16 : right}
        y={below ? y(value) + 17 : y(value) - 6}
        textAnchor={side}
        fontSize={big}
        fontWeight={700}
      >
        {label}
      </text>
    </g>
  );

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={data.aria}
    >
      {data.columns.map((column, i) => {
        const x = 20 + i * (barWidth + gap);
        const middle = x + barWidth / 2;
        return (
          <g key={`${column.month}-${i}`}>
            {column.cutoff === null ? (
              <g className={styles.unlisted}>
                <rect
                  x={x}
                  y={BASE - NOT_LISTED_HEIGHT}
                  width={barWidth}
                  height={NOT_LISTED_HEIGHT}
                  rx={4}
                />
                <text
                  x={middle}
                  y={BASE - 26}
                  textAnchor="middle"
                  fontSize={small}
                >
                  Not
                </text>
                <text
                  x={middle}
                  y={BASE - 10}
                  textAnchor="middle"
                  fontSize={small}
                >
                  listed
                </text>
              </g>
            ) : (
              <g>
                <rect
                  className={styles.bar}
                  x={x}
                  y={y(column.cutoff)}
                  width={barWidth}
                  height={BASE - y(column.cutoff)}
                  rx={4}
                />
                <text
                  className={styles.value}
                  x={middle}
                  y={y(column.cutoff) + 18}
                  textAnchor="middle"
                  fontSize={big}
                  fontWeight={700}
                >
                  {column.cutoff}
                </text>
              </g>
            )}
            <text
              className={styles.month}
              x={middle}
              y={HEIGHT - 14}
              textAnchor="middle"
              fontSize={small}
            >
              {column.month}
            </text>
          </g>
        );
      })}
      {data.pass !== null &&
        guide(data.pass, `Pass mark, ${data.pass}`, styles.pass, true, "start")}
      {data.target &&
        guide(
          data.target.points,
          data.target.label,
          styles.target,
          true,
          "end",
          close && data.target.points < data.you,
        )}
      {guide(
        data.you,
        `You, ${data.you}`,
        styles.you,
        false,
        "end",
        close && data.you <= (data.target?.points ?? 0),
      )}
    </svg>
  );
}

export function CutoffColumns({ data, narrow }: Props) {
  if (narrow !== undefined) return <CutoffChart data={data} narrow={narrow} />;
  return (
    <>
      <div className={styles.wide}>
        <CutoffChart data={data} />
      </div>
      <div className={styles.narrow}>
        <CutoffChart data={data} narrow />
      </div>
    </>
  );
}
