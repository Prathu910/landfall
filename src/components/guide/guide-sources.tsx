import { formatDate } from "@/lib/migration";
import type { SourceEntry } from "@/lib/guide/sources-list";
import styles from "./guide-page.module.css";

/** Every official page behind the guide page, with the date we read it. */
export function GuideSources({ sources }: { sources: SourceEntry[] }) {
  return (
    <ul className={styles.sources}>
      {sources.map((source) => (
        <li key={source.href}>
          <a href={source.href} target="_blank" rel="noreferrer">
            {source.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <span className={styles.sourceDate}>
            Checked {formatDate(source.checkedAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
