import type { CSSProperties } from "react";
import type { PoolView } from "@/lib/updates/data-view";
import parts from "./recap-parts.module.css";
import styles from "./pool-chart.module.css";

/**
 * The 189 pool by points: the published floor solid, the hidden remainder
 * hatched. Each row's score and range are its text; the bars are drawn.
 */
export function PoolChart({ pool }: { pool: PoolView }) {
  return (
    <div className={parts.card}>
      <h3 className={parts.cardTitle}>{pool.heading}</h3>
      <ul className={styles.rows}>
        {pool.bars.map((bar) => (
          <li
            key={bar.score}
            className={`${styles.row} ${bar.passMark ? styles.pass : ""}`}
          >
            <span className={styles.score}>
              {bar.score}
              <span className="sr-only"> points:</span>
            </span>
            <span
              className={styles.track}
              aria-hidden="true"
              style={
                {
                  "--min": bar.minShare,
                  "--max": bar.maxShare,
                } as CSSProperties
              }
            >
              <span className={styles.max} />
              <span className={styles.min} />
            </span>
            <span className={styles.count}>
              {bar.label}
              <span className="sr-only"> EOIs</span>
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.key} aria-hidden="true">
        <span>
          <i className={styles.keyMin} />
          {pool.key.published}
        </span>
        <span>
          <i className={styles.keyMax} />
          {pool.key.hidden}
        </span>
      </p>
      <p className={parts.cap}>{pool.caption}</p>
    </div>
  );
}
