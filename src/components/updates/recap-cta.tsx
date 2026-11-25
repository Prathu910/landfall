import Link from "next/link";
import { RecapBand, type BandTone } from "./recap-band";
import { RoundStamp } from "./round-stamp";
import styles from "./recap-cta.module.css";

const HEADING_ID = "recap-cta-heading";

/** The step from the month's figures to the free points check. */
export function RecapCta({ tone }: { tone: BandTone }) {
  return (
    <RecapBand tone={tone} labelledBy={HEADING_ID}>
      <div className={styles.cta}>
        <div>
          <h2 id={HEADING_ID} className={styles.heading}>
            Where do your points sit?
          </h2>
          <p className={styles.text}>
            Check your points free against the published invitation data for
            your occupation: 189, 190 and 491 in one report.
          </p>
          <div className={styles.actions}>
            <Link href="/check/" className={styles.primary}>
              Check my points <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/sample/" className={styles.secondary}>
              See a sample report
            </Link>
          </div>
        </div>
        <RoundStamp
          top="MIGRATELENS"
          word="FREE POINTS CHECK"
          bottom="189 · 190 · 491"
          rotate={-6}
          paper="var(--brand-deep, var(--brand-ink))"
          className={styles.stamp}
        />
      </div>
    </RecapBand>
  );
}
