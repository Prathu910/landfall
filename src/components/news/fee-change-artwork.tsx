import { ArrowRight } from "lucide-react";
import {
  FEE_EXAMPLES,
  ONSHORE_CHARGE,
} from "@/data/news/onshore-visa-fee-increase-2026";
import geometry from "@/components/home/atlas-map-geometry.json";
import styles from "./fee-change-artwork.module.css";

const money = new Intl.NumberFormat("en-AU");

/** The same typed fee examples feed this illustration and the article table. */
export function FeeChangeArtwork({
  decorative = false,
}: {
  decorative?: boolean;
}) {
  return (
    <div
      className={styles.passport}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative
          ? undefined
          : "New Australian onshore charge: AUD 1,500 per affected applicant. Standard first 485: 5,750 to 7,250; Student 500: 2,500 to 4,000; new onshore partner: 11,710 to 13,210. Exemptions apply."
      }
    >
      <span className={`guill-layer ${styles.linework}`} aria-hidden="true" />
      <svg className={styles.map} viewBox="0 0 760 600" aria-hidden="true">
        <path d={geometry.country} />
      </svg>
      <div className={styles.content}>
        <div className={styles.top}>
          <span>Australia</span>
          <span>28 Nov 2026</span>
        </div>
        <p className={styles.charge}>+${money.format(ONSHORE_CHARGE)}</p>
        <p className={styles.caption}>AUD extra per affected applicant</p>
        <div className={styles.columns}>
          <span>Before</span>
          <span>Now · AUD</span>
        </div>
        <div className={styles.examples}>
          {FEE_EXAMPLES.map((fee) => (
            <div className={styles.example} key={fee.visa}>
              <span className={styles.visa}>{fee.visa}</span>
              <span className={styles.before}>${money.format(fee.before)}</span>
              <ArrowRight aria-hidden="true" />
              <strong>${money.format(fee.after)}</strong>
            </div>
          ))}
        </div>
        <p className={styles.note}>
          Standard main-applicant examples. Exemptions apply.
        </p>
      </div>
    </div>
  );
}
