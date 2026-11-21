import type { PoolBar } from "@/lib/outlook/evidence";
import styles from "./evidence-tables.module.css";

/** The 189 pool by points as a table of bars, so every count stays readable on a phone. */
export function PoolBars({ bars, aria }: { bars: PoolBar[]; aria: string }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table} aria-label={aria}>
        <thead>
          <tr>
            <th scope="col">Points</th>
            <th scope="col">
              <span className="sr-only">Share of the pool</span>
            </th>
            <th scope="col">EOIs</th>
          </tr>
        </thead>
        <tbody>
          {[...bars].reverse().map((bar) => (
            <tr
              key={bar.score}
              className={bar.side === "you" ? styles.youRow : undefined}
            >
              <td>{bar.side === "you" ? `${bar.score} (you)` : bar.score}</td>
              <td className={styles.barCell} aria-hidden="true">
                <span
                  className={`${styles.bar} ${styles[bar.side]}`}
                  style={{ width: `${Math.round(bar.share * 100)}%` }}
                />
              </td>
              <td>{bar.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
