import type { StateTable } from "@/lib/outlook/evidence";
import { LabelChip } from "./label-chip";
import section from "./section.module.css";
import styles from "./evidence-tables.module.css";

/** 190 and 491 by state: the latest invitations at or below the reader's points. */
export function StateTables({ tables }: { tables: StateTable[] }) {
  return (
    <div className={section.two}>
      {tables.map((table) => (
        <div key={table.visa}>
          <h3 className={section.h3}>{table.title}</h3>
          <p className={section.sub}>{table.sub}</p>
          <div className={styles.wrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">State</th>
                  <th scope="col">Latest invited at or below your points</th>
                  <th scope="col">Outlook</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.state}>
                    <td>{row.state}</td>
                    <td>
                      {row.latest}
                      <span className={styles.note}>{row.months}</span>
                    </td>
                    <td>
                      <LabelChip label={row.label} short />
                      {row.flag && (
                        <span className={styles.note}>{row.flag}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
