import { ArrowRight } from "lucide-react";
import { HOME_FAQ } from "./home-faq";
import styles from "./home-faq-list.module.css";

/**
 * The homepage questions as native disclosures: every answer is in the static
 * HTML for crawlers and screen readers, and print opens them all.
 */
export function HomeFaqList() {
  return (
    <div className={styles.list}>
      {HOME_FAQ.map((item) => (
        <details key={item.id} id={`faq-${item.id}`} className={styles.item}>
          <summary className={styles.question}>{item.question}</summary>
          <div className={styles.answer}>
            <p>{item.answer}</p>
            {item.link ? (
              <a className={styles.link} href={item.link.href}>
                {item.link.text}
                <ArrowRight size={15} aria-hidden />
              </a>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
