import type { RoundCard } from "@/lib/occupation-page/charts";
import styles from "./round-cards.module.css";

export function RoundCards({
  cards,
  note,
}: {
  cards: RoundCard[];
  note: string;
}) {
  return (
    <div>
      <ul className={styles.row}>
        {cards.map((card) => (
          <li
            key={card.date}
            className={`${styles.tile} ${card.cutoff === null ? styles.off : styles.on}`}
          >
            <span className={styles.when}>{card.label}</span>
            {card.cutoff === null ? (
              <span className={styles.notListed}>Not listed</span>
            ) : (
              <>
                <b className={styles.cutoff}>{card.cutoff}</b>
                <span className={styles.unit}>points</span>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className={styles.axis} aria-hidden="true">
        <span>← older</span>
        <span>newer →</span>
      </p>
      <p className={styles.note}>{note}</p>
    </div>
  );
}
