import type { StatePageView } from "@/lib/state-page/view";
import { StateCard } from "@/components/states/state-card";
import { RecapBand, type BandTone } from "@/components/updates/recap-band";
import parts from "@/components/updates/recap-parts.module.css";
import { SectionHead } from "@/components/updates/section-head";
import styles from "./state-program-section.module.css";

const HEADING_ID = "program-heading";

/** The program year's rules: the states page's card, each stream, how it selects. */
export function StateProgramSection({
  tone,
  title,
  program,
}: {
  tone: BandTone;
  title: string;
  program: StatePageView["program"];
}) {
  return (
    <RecapBand id="program" tone={tone} labelledBy={HEADING_ID}>
      <SectionHead
        headingId={HEADING_ID}
        kicker={program.kicker}
        title={title}
        lead="State rules are separate from federal points. Each line below is read by hand from the state's official pages and dated."
      />
      <div className={styles.layout}>
        <StateCard card={program.card} headingLevel={3} />
        <div className={styles.detail}>
          {program.streams.map((table) => (
            <div key={table.visa} className={parts.tableWrap}>
              <table className={`${parts.table} ${parts.stack}`}>
                <caption>{table.caption}</caption>
                <thead>
                  <tr>
                    <th scope="col">Stream</th>
                    <th scope="col">Status</th>
                    <th scope="col">Who</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.name}>
                      <th scope="row">{row.name}</th>
                      <td data-label="Status">{row.status}</td>
                      <td data-label="Who">{row.who}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {program.selection.map((line) => (
            <div
              key={line.label}
              className={`${parts.card} ${styles.selection}`}
            >
              <h3 className={parts.cardTitle}>How it selects: {line.label}</h3>
              <p>{line.text}</p>
              <p className={parts.cap}>{line.checked}</p>
              {(line.scoreSystem || line.resultsUrl) && (
                <p className={styles.links}>
                  {line.scoreSystem && (
                    <a href={line.scoreSystem.url} rel="noreferrer">
                      {line.scoreSystem.name}
                    </a>
                  )}
                  {line.resultsUrl && (
                    <a href={line.resultsUrl} rel="noreferrer">
                      Official results page
                    </a>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </RecapBand>
  );
}
