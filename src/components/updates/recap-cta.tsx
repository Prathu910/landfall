import Link from "next/link";
import { RecapBand, type BandTone } from "./recap-band";
import { RoundStamp } from "./round-stamp";
import styles from "./recap-cta.module.css";

const HEADING_ID = "recap-cta-heading";

const DEFAULTS = {
  heading: "Where do your points sit?",
  text: "Check your points free against the published invitation data for your occupation: 189, 190 and 491 in one report.",
  stamp: {
    top: "MIGRATELENS",
    word: "FREE POINTS CHECK",
    bottom: "189 · 190 · 491",
  },
};

/**
 * The step from the page's figures to the free points check. The recap uses
 * the defaults; a state page names its state.
 */
export function RecapCta({
  tone,
  id,
  heading = DEFAULTS.heading,
  text = DEFAULTS.text,
  stamp = DEFAULTS.stamp,
  headingId = HEADING_ID,
}: {
  tone: BandTone;
  id?: string;
  heading?: string;
  text?: string;
  stamp?: { top: string; word: string; bottom: string };
  headingId?: string;
}) {
  return (
    <RecapBand id={id} tone={tone} labelledBy={headingId}>
      <div className={styles.cta}>
        <div>
          <h2 id={headingId} className={styles.heading}>
            {heading}
          </h2>
          <p className={styles.text}>{text}</p>
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
          {...stamp}
          rotate={-6}
          paper="var(--brand-deep, var(--brand-ink))"
          className={styles.stamp}
        />
      </div>
    </RecapBand>
  );
}
