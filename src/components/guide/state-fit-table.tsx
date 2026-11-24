import type { StateFit } from "@/lib/guide/path-fit";
import styles from "./state-fit-table.module.css";

/** Each state's list status for 190 and 491; a table that stacks on phones. */
export function StateFitTable({ states }: { states: StateFit[] }) {
  return (
    <details className={styles.details}>
      <summary>All eight states and territories</summary>
      <table className={styles.table}>
        <caption className="sr-only">
          State and territory occupation lists for 190 and 491
        </caption>
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">190</th>
            <th scope="col">491</th>
          </tr>
        </thead>
        <tbody>
          {states.map((s) => (
            <tr key={s.state}>
              <th scope="row">
                <abbr title={s.name}>{s.state}</abbr>
              </th>
              {(["190", "491"] as const).map((visa) => (
                <td
                  key={visa}
                  data-label={visa}
                  data-status={s.byVisa[visa].status}
                >
                  {s.byVisa[visa].text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
