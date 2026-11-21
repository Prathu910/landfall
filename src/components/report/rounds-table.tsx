import type { RoundRow } from "@/lib/outlook/evidence";
import styles from "./evidence-tables.module.css";

/** Every 189 round since 2022, with whether the reader's points were enough. */
export function RoundsTable({ you, rows }: { you: number; rows: RoundRow[] }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Round</th>
            <th scope="col">Cut-off</th>
            <th scope="col">Your {you}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>{row.cutoff}</td>
              <td
                className={row.verdict === "Enough" ? undefined : styles.short}
              >
                {row.verdict}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
