import type { NotableView } from "@/lib/updates/data-view";
import { CutoffChange } from "./cutoff-change";
import { OccupationLink } from "./occupation-link";
import parts from "./recap-parts.module.css";
import styles from "./notable-table.module.css";

/** The listed occupations with the largest 189 pools, one row each. */
export function NotableTable({ notable }: { notable: NotableView }) {
  const { columns } = notable;
  return (
    <>
      <div className={parts.tableWrap}>
        <table className={`${parts.table} ${parts.stack}`}>
          <caption>{notable.heading}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.occupation}</th>
              <th scope="col" className={parts.number}>
                {columns.cutoff}
              </th>
              <th scope="col" className={parts.number}>
                {columns.previous}
              </th>
              <th scope="col" className={parts.number}>
                {columns.tieBreak}
              </th>
              <th scope="col" className={parts.number}>
                {columns.pool}
              </th>
              <th scope="col" className={parts.number}>
                {columns.invited}
              </th>
            </tr>
          </thead>
          <tbody>
            {notable.rows.map((row) => (
              <tr key={row.occupation.name}>
                <th scope="row">
                  <OccupationLink
                    occupation={row.occupation}
                    className={parts.name}
                  />
                </th>
                <td className={parts.number} data-label={columns.cutoff}>
                  <span className={styles.cutoff}>{row.cutoff}</span>
                </td>
                <td className={parts.number} data-label={columns.previous}>
                  <CutoffChange cell={row.previous} />
                </td>
                <td className={parts.number} data-label={columns.tieBreak}>
                  {row.tieBreak}
                </td>
                <td className={parts.number} data-label={columns.pool}>
                  {row.pool}
                </td>
                <td className={parts.number} data-label={columns.invited}>
                  {row.invited}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={parts.cap}>{notable.caption}</p>
    </>
  );
}
