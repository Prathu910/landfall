import type { CutoffCell } from "@/lib/updates/round-view";
import styles from "./cutoff-change.module.css";

/** A previous round's lowest score, with how this round's differs: "75 (−5)". */
export function CutoffChange({ cell }: { cell: CutoffCell }) {
  const { change } = cell;
  if (!change) return <span className={styles.plain}>{cell.value}</span>;
  return (
    <span>
      {cell.value}{" "}
      <span className={styles[change.direction]}>({change.text})</span>
    </span>
  );
}
