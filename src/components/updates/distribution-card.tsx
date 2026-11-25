import type { CSSProperties } from "react";
import type { OccLink, RoundView } from "@/lib/updates/round-view";
import { OccupationLink } from "./occupation-link";
import parts from "./recap-parts.module.css";
import styles from "./distribution-card.module.css";

function Listed({ list }: { list: { heading: string; items: OccLink[] } }) {
  return (
    <>
      <h3 className={parts.cardTitle}>{list.heading}</h3>
      <ul className={styles.names}>
        {list.items.map((occupation) => (
          <li key={occupation.name}>
            <OccupationLink occupation={occupation} className={parts.name} />
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Occupations by lowest score invited (one column per score, its count
 * above and its score below), then what the round listed that the previous
 * one didn't, and the reverse.
 */
export function DistributionCard({ round }: { round: RoundView }) {
  const { distribution } = round;
  return (
    <div className={parts.card}>
      <h3 className={parts.cardTitle}>Occupations by lowest score invited</h3>
      <ol className={styles.columns}>
        {distribution.bars.map((bar) => (
          <li key={bar.score} className={styles.column}>
            <b>
              {bar.occupations}
              <span className="sr-only">
                {" "}
                {bar.occupations === "1" ? "occupation" : "occupations"} at
              </span>
            </b>
            <span
              className={styles.bar}
              aria-hidden="true"
              style={{ "--share": bar.share } as CSSProperties}
            />
            <span className={styles.score}>
              {bar.score}
              <span className="sr-only"> points</span>
            </span>
          </li>
        ))}
      </ol>
      <p className={parts.cap}>{distribution.caption}</p>
      {round.newlyListed && <Listed list={round.newlyListed} />}
      {round.notListedAgain && <Listed list={round.notListedAgain} />}
    </div>
  );
}
