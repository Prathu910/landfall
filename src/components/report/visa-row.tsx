import type { VisaCard } from "@/lib/outlook/view";
import section from "./section.module.css";
import { VisaStamp } from "./visa-stamp";
import styles from "./visa-row.module.css";

// Each stamp tilts a little differently, as if pressed by hand.
const TILTS = [-4, 5, -2];

/** "Your three visas": one stamp and caption each for 189, 190 and 491. */
export function VisaRow({ visas }: { visas: VisaCard[] }) {
  return (
    <section id="visas" className={`${section.band} ${section.tint}`}>
      <h2 className={section.h2}>Your three visas</h2>
      <p className={section.sub}>
        Each stamp is your outlook for that visa today.
      </p>
      <div className={styles.visas}>
        {visas.map((card, i) => (
          <figure key={card.visa} className={styles.visa}>
            <div className={styles.stamp}>
              <VisaStamp
                shape={card.shape}
                top={card.top}
                word={card.stampWord}
                points={card.points}
                label={card.label}
                rotate={TILTS[i] ?? 0}
              />
            </div>
            <figcaption className={styles.caption}>
              <b className={styles.title}>{card.title}</b>
              <span className={styles.line}>{card.caption}</span>
              {card.flagText && (
                <span className={styles.line}>{card.flagText}</span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
