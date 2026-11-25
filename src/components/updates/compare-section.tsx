import type { CompareView } from "@/lib/updates/compare-view";
import { RecapBand, type BandTone } from "./recap-band";
import parts from "./recap-parts.module.css";
import { SectionHead } from "./section-head";
import styles from "./compare-section.module.css";

const HEADING_ID = "compare-heading";

/** National figures per visa, last month and this, and how to read them. */
export function CompareSection({
  tone,
  compare,
}: {
  tone: BandTone;
  compare: CompareView;
}) {
  const { columns } = compare;
  return (
    <RecapBand id="compare" tone={tone} labelledBy={HEADING_ID}>
      <SectionHead
        headingId={HEADING_ID}
        kicker="Month on month"
        title={compare.heading}
        lead={compare.lead}
      />
      <div className={parts.tableWrap}>
        <table className={`${parts.table} ${parts.stack}`}>
          <thead>
            <tr>
              <th scope="col">{columns.label}</th>
              <th scope="col" className={parts.number}>
                {columns.previous}
              </th>
              <th scope="col" className={parts.number}>
                {columns.current}
              </th>
            </tr>
          </thead>
          <tbody>
            {compare.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className={parts.number} data-label={columns.previous}>
                  {row.previous}
                </td>
                <td className={parts.number} data-label={columns.current}>
                  {row.current}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className={styles.cautions}>
        {compare.cautions.map((caution) => (
          <li key={caution.title}>
            <b>{caution.title}</b> {caution.text}
          </li>
        ))}
      </ul>
    </RecapBand>
  );
}
