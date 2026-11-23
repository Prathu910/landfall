import { formatDate } from "@/lib/migration";
import type { PointsChange } from "@/lib/guide/types";
import { GuideLink } from "./guide-link";
import styles from "./points-changes.module.css";

const STATUS: Record<PointsChange["status"], string> = {
  announced: "Announced",
  said: "Said since",
  published: "Published",
  "not-published": "Not yet published",
};

/** What has been announced about the points test, against what is published. */
export function PointsChanges({ changes }: { changes: PointsChange[] }) {
  return (
    <ol className={styles.changes}>
      {changes.map((change) => (
        <li key={change.status} data-status={change.status}>
          <p className={styles.meta}>
            <span className={styles.status}>{STATUS[change.status]}</span>{" "}
            <time dateTime={change.date}>{formatDate(change.date)}</time>
          </p>
          <h3>{change.title}</h3>
          <p>{change.text}</p>
          <GuideLink className={styles.source} href={change.source}>
            Source, checked {formatDate(change.checkedAt)}
          </GuideLink>
        </li>
      ))}
    </ol>
  );
}
