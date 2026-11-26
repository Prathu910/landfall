import { formatDate } from "@/lib/migration";
import styles from "./guide-page.module.css";

/** The dated direct answer that opens a guide page, with its dates and caveat. */
export function GuideAnswer({
  answer,
  checkedAt,
  feesAsAt,
}: {
  answer: string;
  checkedAt: string;
  feesAsAt: string;
}) {
  return (
    <section className={styles.answer} aria-labelledby="answer-heading">
      <h2 id="answer-heading" className={styles.answerHeading}>
        The short answer
      </h2>
      <p className={styles.answerText}>{answer}</p>
      <dl className={styles.dates}>
        <div>
          <dt>Last checked</dt>
          <dd>
            <time dateTime={checkedAt}>{formatDate(checkedAt)}</time>
          </dd>
        </div>
        <div>
          <dt>Fees as at</dt>
          <dd>
            <time dateTime={feesAsAt}>{formatDate(feesAsAt)}</time>
          </dd>
        </div>
      </dl>
      <p className={styles.caveat}>
        General information, not migration advice. MigrateLens isn’t a
        registered migration agent; for advice on your case, use a{" "}
        <a href="https://www.mara.gov.au/" target="_blank" rel="noreferrer">
          registered migration agent
          <span className="sr-only"> (opens in a new tab)</span>
        </a>{" "}
        or a lawyer.
      </p>
    </section>
  );
}
