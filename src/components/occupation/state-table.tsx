import type { StateRow } from "@/lib/occupation-page/states";
import styles from "./state-table.module.css";

export function StateTable({ rows, asAt }: { rows: StateRow[]; asAt: string }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">On its 2026–27 list</th>
            <th scope="col">Open to</th>
            <th scope="col">190 invitations, {asAt}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.state}>
              <th scope="row">
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noreferrer">
                    {row.name}
                  </a>
                ) : (
                  row.name
                )}
              </th>
              <td data-label="On its 2026–27 list">{row.onList}</td>
              <td data-label="Open to">{row.openTo}</td>
              <td data-label={`190 invitations, ${asAt}`}>{row.invited190}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
