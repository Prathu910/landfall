import type { NotListedView } from "@/lib/updates/data-view";
import { OccupationLink } from "./occupation-link";
import parts from "./recap-parts.module.css";
import styles from "./not-listed-card.module.css";

/** Large 189 pools on the occupation list that the round didn't list. */
export function NotListedCard({ notListed }: { notListed: NotListedView }) {
  return (
    <div className={`${parts.card} ${styles.card}`}>
      <h3 className={parts.cardTitle}>{notListed.heading}</h3>
      <ul className={parts.list}>
        {notListed.items.map((item) => (
          <li key={item.occupation.name}>
            <span>
              <OccupationLink
                occupation={item.occupation}
                className={parts.name}
              />
              <span className={styles.note}>{item.note}</span>
            </span>
            <span className={parts.figure}>
              {item.pool} <small>{item.poolLabel}</small>
            </span>
          </li>
        ))}
      </ul>
      <p className={parts.cap}>{notListed.caption}</p>
    </div>
  );
}
