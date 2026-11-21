import type { VisaCard } from "@/lib/outlook/view";
import section from "./section.module.css";
import { VisaStamp } from "./visa-stamp";
import styles from "./visa-row.module.css";

// Each stamp tilts a little differently, as if pressed by hand.
const TILTS = [-4, 5, -2];

/**
 * "Your three visas": one stamp and caption each for 189, 190 and 491.
 * The printed copy sets `anchor` false so the page keeps one #visas.
 */
export function VisaRow({
  visas,
  anchor = true,
}: {
  visas: VisaCard[];
  anchor?: boolean;
}) {
  return (
    <section
      id={anchor ? "visas" : undefined}
      className={`${section.band} ${section.tint}`}
    >
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
                <span className={styles.line}>
                  {/* On paper the link has nowhere to go, so it prints as text. */}
                  {card.flagHref && anchor ? (
                    <a className={styles.flagLink} href={card.flagHref}>
                      {card.flagText}
                    </a>
                  ) : (
                    card.flagText
                  )}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
