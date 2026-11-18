import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_COPY } from "../../lib/home/home-copy";
import styles from "./doors.module.css";

/**
 * The hero's two ways in, for planners and for people already waiting. Both
 * open the same check with no URL difference; the action link covers the card.
 */
export function Doors() {
  return (
    <div className={styles.doors}>
      {HOME_COPY.doors.map((door, index) => (
        <div
          key={door.id}
          className={`${styles.door} ${index === 0 ? styles.primary : ""}`}
        >
          <p className={styles.tag}>{door.tag}</p>
          <p className={styles.title} id={`door-${door.id}`}>
            {door.title}
          </p>
          <p className={styles.body}>{door.body}</p>
          <Link
            className={styles.action}
            href="/check/"
            aria-describedby={`door-${door.id}`}
          >
            {door.action}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      ))}
    </div>
  );
}
