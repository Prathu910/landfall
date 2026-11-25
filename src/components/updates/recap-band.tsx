import type { ReactNode } from "react";
import styles from "./recap-band.module.css";

export type BandTone = "paper" | "desk";

/** A full-width section of the recap page, labelled by its heading. */
export function RecapBand({
  id,
  tone,
  labelledBy,
  children,
}: {
  id?: string;
  tone: BandTone;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${styles.band} ${styles[tone]}`}
      aria-labelledby={labelledBy}
    >
      <div className={styles.shell}>{children}</div>
    </section>
  );
}
