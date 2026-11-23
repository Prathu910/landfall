"use client";
import {
  formatFeeAmount,
  formatTotal,
  type CostEstimate,
  type CostLine,
} from "@/lib/guide/costs";
import { formatDate } from "@/lib/migration";
import { GuideLink } from "./guide-link";
import styles from "./cost-estimator.module.css";

function reason(line: CostLine): string {
  return line.unit.kind === "varies" || line.unit.kind === "check"
    ? line.unit.reason
    : "";
}

function LineNotes({ line }: { line: CostLine }) {
  const notes = [line.fee.tax, line.fee.note].filter(Boolean).join(". ");
  return (
    <>
      {notes && <span className={styles.lineNote}>{notes}</span>}
      {line.upcoming && (
        <span className={styles.lineNote}>
          From {formatDate(line.upcoming.from)}:{" "}
          {formatFeeAmount(line.upcoming.amount)}.
        </span>
      )}
    </>
  );
}

/** The estimate: totals per currency, the priced lines and what isn't priced. */
export function CostBreakdown({
  estimate,
  feesAsAt,
}: {
  estimate: CostEstimate;
  feesAsAt: string;
}) {
  return (
    <div className={styles.breakdown} aria-live="polite">
      <p className={styles.asAt}>
        Fees as at {formatDate(feesAsAt)}. Visa charges change every 1 July.
      </p>
      <div className={styles.totals}>
        {estimate.totals.map((total) => (
          <p key={total.currency} className={styles.total}>
            <span className={styles.totalLabel}>
              {total.currency === "AUD"
                ? "Priced items, Australian dollars"
                : "Paid in Indian rupees"}
            </span>
            <span className={styles.totalValue}>{formatTotal(total)}</span>
          </p>
        ))}
      </div>
      <p className={styles.fine}>
        Each currency is totalled on its own, with no exchange rate applied. A
        range means a fee depends on your pathway.
      </p>
      <table className={styles.lines}>
        <caption className="sr-only">Priced items</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {estimate.lines.map((line) => (
            <tr key={line.id}>
              <th scope="row">
                {line.label}
                {line.quantity > 1 && ` × ${line.quantity}`}
                <LineNotes line={line} />
                <GuideLink className={styles.source} href={line.fee.source}>
                  Source, checked {formatDate(line.fee.checkedAt)}
                </GuideLink>
              </th>
              <td>{formatFeeAmount(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className={styles.unpricedHeading}>Not in the total</h3>
      <ul className={styles.unpriced}>
        {estimate.unpriced.map((line) => (
          <li key={line.id}>
            <span className={styles.unpricedLabel}>
              {line.label}: <strong>{formatFeeAmount(line.unit)}</strong>
            </span>
            <span className={styles.lineNote}>{reason(line)}</span>
            <GuideLink className={styles.source} href={line.fee.source}>
              Official page
            </GuideLink>
          </li>
        ))}
        <li>
          <span className={styles.unpricedLabel}>
            {estimate.secondInstalment.label}:{" "}
            <strong>
              {"kind" in estimate.secondInstalment.amount
                ? formatFeeAmount(estimate.secondInstalment.amount)
                : ""}
            </strong>
          </span>
          <span className={styles.lineNote}>
            Charged only if Home Affairs asks, before the grant.
          </span>
        </li>
      </ul>
    </div>
  );
}
