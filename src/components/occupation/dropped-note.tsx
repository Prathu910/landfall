import { formatMonth } from "@/lib/report/copy";
import type { MonthKey } from "@/lib/data/types";
import styles from "./dropped-note.module.css";

/**
 * Shown above the direct answer when an occupation has left the SkillSelect
 * data: the page keeps the last published figures and says so.
 */
export function DroppedNote({
  note,
  lastAsAt,
}: {
  note: string;
  lastAsAt: MonthKey;
}) {
  return (
    <aside className={styles.note} aria-labelledby="dropped-note-heading">
      <h2 id="dropped-note-heading" className={styles.heading}>
        {note}
      </h2>
      <p className={styles.text}>
        The figures below are the last ones published, from{" "}
        {formatMonth(lastAsAt)}. They are not current.
      </p>
    </aside>
  );
}
