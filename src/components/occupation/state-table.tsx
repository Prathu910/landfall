import type { StateRow } from "@/lib/occupation-page/states";
import styles from "./state-table.module.css";

export function StateTable({ rows, asAt }: { rows: StateRow[]; asAt: string }) {
  return (
    <div className={styles.wrap}>
      <table role="table" className={styles.table}>
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">
              State
            </th>
            <th scope="col" role="columnheader">
              On its 2026–27 list
            </th>
            <th scope="col" role="columnheader">
              Open to
            </th>
            <th scope="col" role="columnheader">
              190 invitations, {asAt}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={row.state} role="row">
              <th scope="row" role="rowheader">
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noreferrer">
                    {row.name}
                  </a>
                ) : (
                  row.name
                )}
              </th>
              <td role="cell" data-label="On its 2026–27 list">
                {row.onList}
              </td>
              <td role="cell" data-label="Open to">
                {row.openTo}
              </td>
              <td role="cell" data-label={`190 invitations, ${asAt}`}>
                {row.invited190}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
