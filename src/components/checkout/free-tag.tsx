import styles from "./ticket.module.css";

/** The tilted "FREE" mark beside a founding price. */
export function FreeTag() {
  return <span className={styles.free}>FREE</span>;
}
