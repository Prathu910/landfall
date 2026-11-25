import type { RoundView } from "@/lib/updates/round-view";
import { CutoffChange } from "./cutoff-change";
import { OccupationLink } from "./occupation-link";
import parts from "./recap-parts.module.css";
import styles from "./round-table.module.css";

/** Every occupation the round listed, folded away under its summary. */
export function RoundTable({ round }: { round: RoundView }) {
  const { columns, rows } = round.table;
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        All {round.listed} occupations in the {round.dateText} round
      </summary>
      <div className={parts.tableWrap}>
        <table className={`${parts.table} ${parts.stack}`}>
          <thead>
            <tr>
              <th scope="col">{columns.occupation}</th>
              <th scope="col" className={parts.number}>
                {columns.cutoff}
              </th>
              {columns.previous && (
                <th scope="col" className={parts.number}>
                  {columns.previous}
                </th>
              )}
              <th scope="col" className={parts.number}>
                {columns.tieBreak}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.occupation.name}-${index}`}>
                <th scope="row">
                  <OccupationLink
                    occupation={row.occupation}
                    className={parts.name}
                  />
                </th>
                <td className={parts.number} data-label={columns.cutoff}>
                  {row.cutoff}
                </td>
                {columns.previous && row.previous && (
                  <td className={parts.number} data-label={columns.previous}>
                    <CutoffChange cell={row.previous} />
                  </td>
                )}
                <td className={parts.number} data-label={columns.tieBreak}>
                  {row.tieBreak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={parts.cap}>{round.table.caption}</p>
    </details>
  );
}
