import styles from "./our-read.module.css";

/** "Our read": the AI text when it passed the check, else the template paragraph. */
export function OurRead({
  text,
  source = "template",
  pending = false,
}: {
  text: string;
  source?: "ai" | "template";
  pending?: boolean;
}) {
  return (
    <div className={styles.read} aria-busy={pending}>
      <b className={styles.title}>Our read</b>
      <p className={styles.text}>{pending ? "Writing our read…" : text}</p>
      <small className={styles.note}>
        {source === "ai"
          ? "Written by AI from the numbers in this report."
          : "Written from the numbers in this report."}
      </small>
    </div>
  );
}
