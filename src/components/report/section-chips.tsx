import { REPORT_SECTIONS } from "@/lib/report/sections";
import styles from "./section-chips.module.css";

/** Sticky jump links under the site header, below 1024px (spec 8). */
export function SectionChips() {
  return (
    <nav className={`${styles.chips} no-print`} aria-label="Report sections">
      {REPORT_SECTIONS.map(([id, chip]) => (
        <a key={id} className={styles.chip} href={`#${id}`}>
          {chip}
        </a>
      ))}
    </nav>
  );
}
