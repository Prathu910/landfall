import type { StatusChip } from "@/lib/occupation-page/summary";
import styles from "./occupation-summary.module.css";

export function OccupationSummary({
  chips,
  sentences,
  sourceLine,
}: {
  chips: StatusChip[];
  sentences: string[];
  sourceLine: string;
}) {
  return (
    <section className={styles.strip} aria-labelledby="what-data-says">
      <h2 id="what-data-says" className={styles.eyebrow}>
        What the data says
      </h2>
      {sentences.map((sentence, i) => (
        <p key={sentence} className={i === 0 ? styles.headline : styles.detail}>
          {sentence}
        </p>
      ))}
      {chips.length > 0 && (
        <ul className={styles.chips}>
          {chips.map((chip) => (
            <li
              key={chip.label}
              className={`${styles.chip} ${styles[chip.tone]}`}
            >
              {chip.label}
            </li>
          ))}
        </ul>
      )}
      <p className={styles.source}>{sourceLine}</p>
    </section>
  );
}
