import Link from "next/link";
import { statePath } from "@/lib/state-page/slug";
import type { StateRow } from "@/lib/occupation-page/states";
import styles from "./state-table.module.css";

export function StateTable({
  rows,
  invitedHeading,
}: {
  rows: StateRow[];
  invitedHeading: string;
}) {
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
              {invitedHeading}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={row.state} role="row">
              <th scope="row" role="rowheader">
                <Link href={statePath(row.state)}>{row.name}</Link>
                {row.href && (
                  <a
                    href={row.href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.official}
                  >
                    Official page
                    <span className="sr-only">
                      {" "}
                      for {row.name} (opens in a new tab)
                    </span>
                  </a>
                )}
              </th>
              <td role="cell" data-label="On its 2026–27 list">
                {row.onList}
              </td>
              <td role="cell" data-label="Open to">
                {row.openTo}
              </td>
              <td role="cell" data-label={invitedHeading}>
                {row.invited190}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
