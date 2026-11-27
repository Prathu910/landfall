import Link from "next/link";
import type { OccupationTableView } from "@/lib/state-page/view";
import { OccupationLink } from "@/components/updates/occupation-link";
import { RecapBand, type BandTone } from "@/components/updates/recap-band";
import parts from "@/components/updates/recap-parts.module.css";
import { SectionHead } from "@/components/updates/section-head";
import styles from "./state-sections.module.css";

const HEADING_ID = "occupations-heading";

function OccupationTable({ table }: { table: OccupationTableView }) {
  if (table.empty) {
    return (
      <div className={parts.card}>
        <h3 className={parts.cardTitle}>{table.caption}</h3>
        <p>{table.empty}</p>
      </div>
    );
  }
  const { columns } = table;
  return (
    <div>
      <div className={parts.tableWrap}>
        <table className={`${parts.table} ${parts.stack}`}>
          <caption>{table.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.occupation}</th>
              <th scope="col" className={parts.number}>
                {columns.latest}
              </th>
              <th scope="col" className={parts.number}>
                {columns.scores}
              </th>
              <th scope="col" className={parts.number}>
                {columns.months}
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row.occupation.name}>
                <th scope="row">
                  <OccupationLink occupation={row.occupation} />
                </th>
                <td className={parts.number} data-label={columns.latest}>
                  {row.latest}
                </td>
                <td className={parts.number} data-label={columns.scores}>
                  {row.scores}
                </td>
                <td className={parts.number} data-label={columns.months}>
                  {row.months}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.after && <p className={parts.cap}>{table.after}</p>}
    </div>
  );
}

/** The occupations with a published count for the state, 190 then 491. */
export function StateOccupationsSection({
  tone,
  title,
  lead,
  tables,
  listLink,
}: {
  tone: BandTone;
  title: string;
  lead: string;
  tables: OccupationTableView[];
  listLink: string;
}) {
  return (
    <RecapBand id="occupations" tone={tone} labelledBy={HEADING_ID}>
      <SectionHead
        headingId={HEADING_ID}
        kicker="By occupation"
        title={title}
        lead={lead}
      />
      <div className={styles.stack}>
        {tables.map((table) => (
          <OccupationTable key={table.visa} table={table} />
        ))}
      </div>
      <p className={styles.note}>
        <Link href="/occupations/">{listLink}</Link>
      </p>
    </RecapBand>
  );
}
