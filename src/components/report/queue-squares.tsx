import type { QueueGroup, QueueView } from "@/lib/outlook/queue-view";
import styles from "./queue-squares.module.css";

type Props = { data: QueueView; narrow?: boolean };

const GAP = 3;
const TOP = 30;

function QueueChart({ data, narrow = false }: Props) {
  const columns = narrow ? 20 : 27;
  const size = narrow ? 13 : 11;
  const width = narrow ? 340 : 400;
  const textSize = narrow ? 14.5 : 13.5;
  const perRow = narrow ? 1 : 2;
  const rowHeight = narrow ? 26 : 22;

  const squares: { group: QueueGroup; index: number }[] = [];
  for (const group of data.groups) {
    for (let k = 0; k < group.squares; k++) {
      squares.push({ group, index: squares.length });
    }
  }
  const rows = Math.ceil(squares.length / columns);
  const legendTop = TOP + rows * (size + GAP) + 16;
  const height =
    legendTop + Math.ceil(data.groups.length / perRow) * rowHeight + 4;

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={data.aria}
    >
      <text className={styles.note} x={0} y={16} fontSize={textSize}>
        {`Each square is about ${data.unit} EOIs. Front of the queue first.`}
      </text>
      {squares.map(({ group, index }) => (
        <rect
          key={index}
          className={styles[group.key]}
          x={(index % columns) * (size + GAP)}
          y={TOP + Math.floor(index / columns) * (size + GAP)}
          width={size}
          height={size}
          rx={2}
        />
      ))}
      {data.groups.map((group, j) => (
        <g
          key={group.key}
          transform={`translate(${(j % perRow) * 200} ${legendTop + Math.floor(j / perRow) * rowHeight})`}
        >
          <rect className={styles[group.key]} width={13} height={13} rx={2} />
          <text
            className={styles.legend}
            x={20}
            y={12}
            fontSize={textSize}
            fontWeight={group.emphasis ? 700 : 500}
          >
            {group.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function QueueSquares({ data, narrow }: Props) {
  if (narrow !== undefined) return <QueueChart data={data} narrow={narrow} />;
  return (
    <>
      <div className={styles.wide}>
        <QueueChart data={data} />
      </div>
      <div className={styles.narrow}>
        <QueueChart data={data} narrow />
      </div>
    </>
  );
}
