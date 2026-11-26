import type { StatePageView } from "@/lib/state-page/view";
import { RecapBand, type BandTone } from "@/components/updates/recap-band";
import parts from "@/components/updates/recap-parts.module.css";
import styles from "./state-glance.module.css";

const HEADING_ID = "glance-heading";

/** The four figures at a glance, then the nominations pair. Text only. */
export function StateGlance({
  tone,
  title,
  glance,
}: {
  tone: BandTone;
  title: string;
  glance: StatePageView["glance"];
}) {
  return (
    <RecapBand id="glance" tone={tone} labelledBy={HEADING_ID}>
      <p className={parts.kicker}>At a glance</p>
      <h2 id={HEADING_ID} className={parts.heading}>
        {title}
      </h2>
      <ul className={styles.tiles}>
        {glance.tiles.map((tile) => (
          <li key={tile.label} className={`${parts.card} ${styles.tile}`}>
            <p className={styles.label}>{tile.label}</p>
            <p className={styles.figure}>{tile.figure}</p>
            {tile.note && <p className={styles.note}>{tile.note}</p>}
          </li>
        ))}
      </ul>
      {glance.nominations && (
        <p className={styles.nominations}>{glance.nominations}</p>
      )}
    </RecapBand>
  );
}
