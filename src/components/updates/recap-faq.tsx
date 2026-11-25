import type { FaqEntry } from "@/lib/seo/json-ld";
import { RecapBand, type BandTone } from "./recap-band";
import parts from "./recap-parts.module.css";
import styles from "./recap-faq.module.css";

const HEADING_ID = "faq-heading";
/** The first two answers start open, as in the mockup. */
const OPEN = 2;

/** The month's questions; the same entries are the page's FAQPage JSON-LD. */
export function RecapFaq({
  tone,
  title,
  faq,
}: {
  tone: BandTone;
  title: string;
  faq: FaqEntry[];
}) {
  return (
    <RecapBand id="faq" tone={tone} labelledBy={HEADING_ID}>
      <div className={styles.faq}>
        <p className={parts.kicker}>Questions</p>
        <h2 id={HEADING_ID} className={parts.heading}>
          {title}
        </h2>
        {faq.map((entry, index) => (
          <details
            key={entry.question}
            className={styles.item}
            open={index < OPEN}
          >
            <summary className={styles.question}>{entry.question}</summary>
            <p className={styles.answer}>{entry.answer}</p>
          </details>
        ))}
      </div>
    </RecapBand>
  );
}
