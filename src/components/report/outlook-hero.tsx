import type { ReportOutlookView } from "@/lib/outlook/view";
import { BigStamp } from "./big-stamp";
import { DownloadPdfButton } from "./download-pdf-button";
import { OurRead } from "./our-read";
import type { OurReadResult } from "./use-our-read";
import section from "./section.module.css";
import styles from "./outlook-hero.module.css";

/** The verdict: who, headline, fact, best route, wait, why, Our read and the stamp. */
export function OutlookHero({
  view,
  read,
}: {
  view: ReportOutlookView;
  read: OurReadResult;
}) {
  const { headline, stamp } = view;
  return (
    <section id="outlook" className={`${section.band} ${styles.hero}`}>
      <div className={styles.text}>
        <p className={styles.who}>
          <b>{headline.who}</b> {view.whoDetail}
        </p>
        <h1 className={styles.h1}>{headline.h1}</h1>
        <p className={styles.fact}>{headline.fact}</p>
        <div className={styles.read}>
          <OurRead
            text={read.text}
            source={read.source}
            pending={read.pending}
          />
        </div>
        <dl className={styles.meta}>
          <div className={styles.tile}>
            <dt>Best route</dt>
            <dd>{headline.best}</dd>
          </div>
          <div className={styles.tile}>
            <dt>Estimated wait</dt>
            <dd>{view.wait}</dd>
          </div>
        </dl>
        <p className={styles.why}>{headline.why}</p>
        <div className={styles.download}>
          <DownloadPdfButton />
        </div>
      </div>
      <div className={styles.stamp}>
        <BigStamp
          label={stamp.label}
          ring={view.stampRing}
          bottom={view.stampBottom}
          tooFew={stamp.tooFew}
        />
      </div>
    </section>
  );
}
