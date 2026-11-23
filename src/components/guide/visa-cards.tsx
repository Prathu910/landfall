import Link from "next/link";
import type { Visa } from "@/lib/data/types";
import type { VisaGuide } from "@/lib/guide/types";
import styles from "./guide-page.module.css";

/** One card per visa guide, leaving out the page the reader is on. */
export function VisaCards({
  guides,
  exclude,
}: {
  guides: VisaGuide[];
  exclude?: Visa;
}) {
  return (
    <ul className={styles.cards}>
      {guides
        .filter((g) => g.visa !== exclude)
        .map((guide) => (
          <li key={guide.visa}>
            <Link className={styles.card} href={`/guide/${guide.visa}/`}>
              <span className={styles.cardVisa}>{guide.visa}</span>
              <span className={styles.cardName}>{guide.name}</span>
              <span className={styles.cardText}>{guide.what}</span>
              <span className={styles.cardLink}>
                Read the {guide.visa} guide <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
    </ul>
  );
}
