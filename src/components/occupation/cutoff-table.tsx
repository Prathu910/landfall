import Link from "next/link";
import type { CutoffTable as Table } from "@/lib/occupation-page/cutoffs";
import { formatDate } from "@/lib/migration";
import styles from "./cutoff-table.module.css";

/** Every occupation's 189 cut-off in the recent rounds; a missing row is "Not listed". */
export function CutoffTable({ table }: { table: Table }) {
  const heads = table.rounds.map((date) => formatDate(date));
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">
          189 cut-offs by occupation, rounds of {heads.join(", ")}
        </caption>
        <thead>
          <tr>
            <th scope="col">Occupation</th>
            {table.rounds.map((date, i) => (
              <th key={date} scope="col" className={styles.num}>
                <time dateTime={date}>{heads[i]}</time>
              </th>
            ))}
            <th scope="col">Tie-break date</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.code ?? row.name}>
              <th scope="row">
                {row.path ? <Link href={row.path}>{row.name}</Link> : row.name}
                {row.code && <span className={styles.code}>{row.code}</span>}
              </th>
              {row.cutoffs.map((cutoff, i) => (
                <td
                  key={table.rounds[i]}
                  className={cutoff === null ? styles.missing : styles.num}
                  data-label={heads[i]}
                >
                  {cutoff === null ? "Not listed" : cutoff}
                </td>
              ))}
              <td data-label="Tie-break date">
                {row.tieBreak ? (
                  <time dateTime={row.tieBreak}>
                    {formatDate(row.tieBreak)}
                  </time>
                ) : (
                  "Not published"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
