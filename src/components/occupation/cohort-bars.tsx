import type { CohortRow } from "@/lib/occupation-page/charts";
import { formatCount } from "@/lib/report/copy";
import styles from "./cohort-bars.module.css";

export function CohortBars({
  rows,
  note,
}: {
  rows: CohortRow[];
  note: string;
}) {
  const legend = rows[0]?.segments ?? [];
  const largest = Math.max(1, ...rows.map((r) => r.total.max));
  return (
    <div>
      <ul className={styles.legend}>
        {legend.map((s) => (
          <li key={s.key} className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles[s.key]}`} />
            {s.label}
          </li>
        ))}
        <li className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.maskedSwatch}`} />
          Under 20 (masked)
        </li>
      </ul>
      <ul className={styles.rows}>
        {rows.map((row) => (
          <li key={row.month} className={styles.row}>
            <span className={styles.month}>{row.month}</span>
            <span
              className={styles.bar}
              style={{ width: `${(row.total.max / largest) * 100}%` }}
            >
              {row.segments
                .filter((s) => s.count.max > 0)
                .map((s) => (
                  <span
                    key={s.key}
                    title={`${s.label}: ${s.masked ? "under 20" : formatCount(s.count)}`}
                    className={`${styles.seg} ${s.masked ? styles.masked : styles[s.key]}`}
                    style={{ flexGrow: s.count.max }}
                  />
                ))}
            </span>
            <span className={styles.total}>{formatCount(row.total)}</span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
