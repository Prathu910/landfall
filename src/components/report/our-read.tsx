import styles from "./our-read.module.css";

/** "Our read": the template paragraph built from the report's facts. */
export function OurRead({ text }: { text: string }) {
  return (
    <div className={styles.read}>
      <b className={styles.title}>Our read</b>
      <p className={styles.text}>{text}</p>
      <small className={styles.note}>
        Written from the numbers in this report.
      </small>
    </div>
  );
}
