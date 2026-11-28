import {
  FEE_EXAMPLES,
  FEE_SOURCE_URLS,
} from "@/data/news/onshore-visa-fee-increase-2026";
import styles from "./news.module.css";

const money = new Intl.NumberFormat("en-AU");

export function FeeComparison() {
  return (
    <section
      id="before-and-after"
      className={styles.section}
      aria-labelledby="fees-heading"
    >
      <p className={styles.kicker}>The before and after</p>
      <h2 id="fees-heading">What do the new visa fees look like?</h2>
      <p>
        For these standard main applicants, the new charge adds AUD 1,500 to the
        existing base fee. The fee category and application circumstances still
        matter.
      </p>
      <div
        className={styles.tableScroll}
        tabIndex={0}
        role="region"
        aria-label="Visa fee comparison, scroll horizontally on small screens"
      >
        <table className={styles.feeTable}>
          <caption>
            Standard main-applicant examples · all amounts in AUD
          </caption>
          <thead>
            <tr>
              <th scope="col">Visa application</th>
              <th scope="col">Before 28 Nov</th>
              <th scope="col">From 28 Nov 2026</th>
            </tr>
          </thead>
          <tbody>
            {FEE_EXAMPLES.map((fee) => (
              <tr key={fee.visa}>
                <th scope="row">
                  <span>
                    {fee.name} {fee.visa}
                  </span>
                  <small>{fee.scope}</small>
                </th>
                <td>${money.format(fee.before)}</td>
                <td>
                  <strong>${money.format(fee.after)}</strong>
                  <small>+ $1,500</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>
        These are the base charge plus the new onshore charge, not a quote for
        the whole application. Dependants, other applicable charges and
        concessional rates are excluded. Sources:{" "}
        <a href={FEE_SOURCE_URLS.baseFees}>Schedule 1 base fees</a> and{" "}
        <a href={FEE_SOURCE_URLS.amendment}>the new charge</a>.
      </p>
      <div className={styles.callout}>
        <strong>Already on an 820 partner visa?</strong>
        <p>
          The partner example is for a standard{" "}
          <strong>new combined application</strong>. It does not mean every
          existing 820 holder owes another $13,210 when progressing to an 801.
        </p>
      </div>
    </section>
  );
}
