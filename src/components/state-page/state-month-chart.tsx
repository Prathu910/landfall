import type { CSSProperties } from "react";
import type { MonthsCardView } from "@/lib/state-page/months-view";
import parts from "@/components/updates/recap-parts.module.css";
import styles from "./state-month-chart.module.css";

/**
 * One visa's 12 month ends: the published floor solid, the hidden range
 * hatched. Columns on wide screens, rows on phones; every value is text,
 * the bars are drawn. Static, so reduced motion needs nothing.
 */
export function StateMonthChart({ card }: { card: MonthsCardView }) {
  return (
    <div className={parts.card}>
      <h3 className={parts.cardTitle}>{card.heading}</h3>
      <ol className={styles.chart}>
        {card.columns.map((col) => (
          <li
            key={col.month}
            className={`${styles.month} ${styles[col.kind]} ${col.latest ? styles.latest : ""} ${col.programYear ? styles.yearStart : ""}`}
            data-year={col.programYear ?? undefined}
          >
            <span className={styles.value}>
              <span aria-hidden="true">{col.value}</span>
              <span className="sr-only">{col.full}</span>
            </span>
            <span
              className={styles.track}
              aria-hidden="true"
              style={
                {
                  "--min": col.minShare,
                  "--max": col.maxShare,
                } as CSSProperties
              }
            >
              <span className={styles.max} />
              <span className={styles.min} />
            </span>
            <span className={styles.when} aria-hidden="true">
              {col.label}
              {col.year && <small>{col.year}</small>}
            </span>
          </li>
        ))}
      </ol>
      <p className={styles.key} aria-hidden="true">
        <span>
          <i className={styles.keyMin} />
          {card.key.published}
        </span>
        <span>
          <i className={styles.keyMax} />
          {card.key.hidden}
        </span>
      </p>
      {card.note && <p className={parts.cap}>{card.note}</p>}
      <details className={styles.details}>
        <summary>{card.table.summary}</summary>
        <div className={parts.tableWrap}>
          <table className={`${parts.table} ${parts.stack}`}>
            <caption>{card.table.caption}</caption>
            <thead>
              <tr>
                <th scope="col">Month end</th>
                <th scope="col">Holding an invitation</th>
                <th scope="col">Hidden small counts</th>
              </tr>
            </thead>
            <tbody>
              {card.table.rows.map((row) => (
                <tr key={row.month}>
                  <th scope="row">{row.month}</th>
                  <td data-label="Holding an invitation">{row.held}</td>
                  <td data-label="Hidden small counts">{row.hidden}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
