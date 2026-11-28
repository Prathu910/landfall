import { UsersRound } from "lucide-react";
import {
  FEE_FAQ,
  FEE_SOURCE_URLS,
  ONSHORE_CHARGE,
} from "@/data/news/onshore-visa-fee-increase-2026";
import styles from "./news.module.css";

const money = new Intl.NumberFormat("en-AU");

export function VisaFeeExplainer() {
  return (
    <>
      <section
        id="families"
        className={styles.section}
        aria-labelledby="family-heading"
      >
        <h2 id="family-heading">For a family, it can be more than $1,500</h2>
        <p>
          This is a charge for <strong>each affected applicant</strong>. Certain
          family members in a combined application can also owe it, including
          where they are outside Australia but the primary applicant is in
          Australia.
        </p>
        <figure className={styles.familyGraphic}>
          <div aria-hidden="true">
            <UsersRound />
            <span>2 affected applicants</span>
            <strong>+ ${money.format(ONSHORE_CHARGE * 2)}</strong>
          </div>
          <figcaption>
            Two applicants who both attract the charge add AUD{" "}
            {money.format(ONSHORE_CHARGE * 2)} to their combined fees. This is
            the extra charge only; family members’ base fees differ.
          </figcaption>
        </figure>
        <p className={styles.note}>
          The family member must still fall within a listed fee category.
          Source:{" "}
          <a href={FEE_SOURCE_URLS.amendment}>regulation 2.12C(10)(a)(ii)</a>.
        </p>
      </section>
      <section
        id="check-your-fee"
        className={styles.section}
        aria-labelledby="check-heading"
      >
        <h2 id="check-heading">How to check your application’s total</h2>
        <p>
          Use the{" "}
          <a href={FEE_SOURCE_URLS.estimator}>
            official Home Affairs Visa Pricing Estimator
          </a>
          . Select your visa and stream, passport country, application date,
          location and family members. It gives an estimate, and may not include
          a second instalment payable for some visas.
        </p>
        <p>
          A fee estimate does not establish eligibility to apply onshore. Check
          the visa’s application rules separately; an offshore application is
          not an available alternative for every visa or applicant.
        </p>
        <div className={styles.secondaryNote}>
          <h3>A separate change in the same instrument</h3>
          <p>
            The amendment also raises a specified Global Special Humanitarian
            202 base fee from AUD 570 to AUD 580. That is a separate adjustment,
            not the $1,500 onshore charge. See{" "}
            <a href={FEE_SOURCE_URLS.amendment}>Part 2 of Schedule 1</a>.
          </p>
        </div>
      </section>
      <section
        id="questions"
        className={styles.section}
        aria-labelledby="questions-heading"
      >
        <h2 id="questions-heading">Common questions</h2>
        <div className={styles.questions}>
          {FEE_FAQ.map((entry) => (
            <details key={entry.question}>
              <summary>{entry.question}</summary>
              <p>{entry.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
