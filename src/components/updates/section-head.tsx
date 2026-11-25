import type { ReactNode } from "react";
import parts from "./recap-parts.module.css";
import { RectStamp } from "./rect-stamp";
import styles from "./section-head.module.css";

export type HeadStamp = { top: string; word: string; bottom: string };

/** A recap section's kicker, heading and lead, beside its visa stamp. */
export function SectionHead({
  headingId,
  kicker,
  title,
  lead,
  stamp,
}: {
  headingId: string;
  kicker: string;
  title: string;
  lead?: ReactNode;
  stamp?: HeadStamp;
}) {
  return (
    <div className={`${styles.head} ${stamp ? styles.withStamp : ""}`}>
      {stamp && (
        <RectStamp
          {...stamp}
          rotate={stamp.word === "189" ? -4 : 4}
          className={styles.stamp}
        />
      )}
      <div>
        <p className={parts.kicker}>{kicker}</p>
        <h2 id={headingId} className={parts.heading}>
          {title}
        </h2>
        {lead && <p className={parts.lead}>{lead}</p>}
      </div>
    </div>
  );
}
