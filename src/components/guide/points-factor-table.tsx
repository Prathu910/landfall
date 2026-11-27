import type { PointsFactor } from "@/data/guide/points-table";
import styles from "./points-factor-table.module.css";

/** One factor of the points test as a real table: what earns the points, and how many. */
export function PointsFactorTable({ factor }: { factor: PointsFactor }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">{factor.factor}: points</caption>
        <thead>
          <tr>
            <th scope="col">{factor.factor}</th>
            <th scope="col" className={styles.points}>
              Points
            </th>
          </tr>
        </thead>
        <tbody>
          {factor.rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.band}</th>
              <td className={styles.points}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
