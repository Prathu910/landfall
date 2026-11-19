import type { Faq } from "@/lib/occupation-page/faq";
import styles from "./occupation-faq.module.css";

export function OccupationFaq({ items }: { items: Faq[] }) {
  return (
    <div className={styles.list}>
      {items.map((item, i) => (
        <details key={item.question} className={styles.item} open={i === 0}>
          <summary className={styles.question}>{item.question}</summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
