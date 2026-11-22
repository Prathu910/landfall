import type { ReportSource } from "@/lib/data/report-source";
import type { Evidence, StateTable } from "@/lib/outlook/evidence";
import { LabelChip } from "./label-chip";
import { PoolBars } from "./pool-bars";
import { ReportSources } from "./report-sources";
import { RoundsTable } from "./rounds-table";
import section from "./section.module.css";
import tables from "./evidence-tables.module.css";
import styles from "./print-appendix.module.css";

/** One visa's states with the latest invitations, the label and a rules line. */
function PrintStateTable({ table }: { table: StateTable }) {
  return (
    <div>
      <h3 className={section.h3}>{table.title}</h3>
      <table className={tables.table}>
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
                <span className={tables.note}>
                  {row.months}. {row.rules}
                </span>
              </td>
              <td>
                <LabelChip label={row.label} short />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The printed evidence appendix: every 189 round, the pool by points, the
 * 190 and 491 state tables side by side, and the sources. The detailed views
 * inside "See the evidence" stay on screen (spec 11).
 */
export function PrintAppendix({
  evidence,
  source,
}: {
  evidence: Evidence;
  source: ReportSource;
}) {
  return (
    <section className={styles.appendix}>
      <p className={styles.tag}>Appendix</p>
      <h2 className={section.h2}>The evidence behind your report</h2>
      <p className={section.sub}>
        Everything the labels and estimates above are built from.
      </p>
      <div className={section.two}>
        <div>
          <h3 className={section.h3}>Every 189 round since 2022</h3>
          {evidence.rounds ? (
            <RoundsTable
              you={evidence.rounds.you}
              rows={evidence.rounds.rows}
            />
          ) : (
            <p className={section.empty}>{evidence.roundsEmpty}</p>
          )}
        </div>
        <div>
          <h3 className={section.h3}>The 189 pool by points</h3>
          {evidence.pool ? (
            <>
              <p className={section.sub}>{evidence.pool.note}</p>
              <PoolBars bars={evidence.pool.bars} aria={evidence.pool.aria} />
            </>
          ) : (
            <p className={section.empty}>{evidence.poolEmpty}</p>
          )}
        </div>
      </div>
      <div className={`${section.two} ${styles.states}`}>
        {evidence.states.length ? (
          evidence.states.map((table) => (
            <PrintStateTable key={table.visa} table={table} />
          ))
        ) : (
          <p className={section.empty}>{evidence.statesEmpty}</p>
        )}
      </div>
      <ReportSources source={source} />
    </section>
  );
}
