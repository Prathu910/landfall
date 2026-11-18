import type { Interval } from "../../lib/data/types";
import { formatCount } from "../../lib/report/copy";
import type { QueueSegments } from "../../lib/report/panel-189";
import styles from "./queue-bar.module.css";

export type QueueLabels = { ahead: string; same: string; lower: string };

const DEFAULT_LABELS: QueueLabels = {
  ahead: "Higher score",
  same: "Your score",
  lower: "Lower scores",
};
const MIN_WIDTH_PX = 2;

const midpoint = (i: Interval) => (i.min + i.max) / 2;

/** Width as a CSS length: a share of the bar, never under 2px for a non-zero max. */
export function segmentWidth(part: Interval, total: Interval): string {
  const share =
    midpoint(total) > 0 ? (midpoint(part) / midpoint(total)) * 100 : 0;
  const width = `${Math.min(100, Math.max(0, share))}%`;
  return part.max > 0 ? `max(${width}, ${MIN_WIDTH_PX}px)` : "0";
}

/** A bar of the pool split by score; widths use interval midpoints, labels never collapse a masked count. */
export function QueueBar({
  segments,
  labels = DEFAULT_LABELS,
}: {
  segments: QueueSegments;
  labels?: QueueLabels;
}) {
  const parts = [
    { key: "ahead", label: labels.ahead, count: segments.ahead },
    { key: "same", label: labels.same, count: segments.same },
    { key: "lower", label: labels.lower, count: segments.lower },
  ] as const;
  const aria = parts
    .map((p) => `${p.label}: ${formatCount(p.count)} EOIs`)
    .join("; ");
  return (
    <div className={styles.wrap}>
      <div className={styles.bar} role="img" aria-label={aria}>
        {parts.map((p) => (
          <span
            key={p.key}
            className={styles[p.key]}
            style={{ width: segmentWidth(p.count, segments.total) }}
          />
        ))}
      </div>
      <ul className={styles.legend}>
        {parts.map((p) => (
          <li key={p.key}>
            <i className={styles[p.key]} aria-hidden="true" />
            {p.label}: <b>{formatCount(p.count)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
