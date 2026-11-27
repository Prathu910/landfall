import Link from "next/link";
import type { CSSProperties } from "react";
import type { OutlookLabel } from "@/lib/outlook/labels";
import type { OccupationVerdict as Verdict } from "@/lib/occupation-page/verdict";
import styles from "./occupation-verdict.module.css";

/** A visa the occupation can't use takes the neutral grey of "no data". */
const NEUTRAL: OutlookLabel = "no-data";

function inkOf(label: OutlookLabel): CSSProperties {
  return {
    "--stamp-ink": `var(--label-${label}-ink)`,
    "--stamp-bg": `var(--label-${label}-bg)`,
  } as CSSProperties;
}

/** The 189 label at common scores, as stamps, near the top of the page. */
export function OccupationVerdict({
  name,
  verdict,
  figuresFrom,
}: {
  name: string;
  verdict: Verdict;
  /** The data month, for an occupation that has dropped out of the data. */
  figuresFrom?: string;
}) {
  return (
    <section className={styles.strip} aria-labelledby="verdict-heading">
      <h2 id="verdict-heading" className={styles.heading}>
        Is my score enough for {name} 189?
      </h2>
      {verdict.kind === "scores" ? (
        <>
          <ol className={styles.stamps}>
            {verdict.cells.map((cell) => (
              <li
                key={cell.points}
                className={styles.stamp}
                style={inkOf(cell.label)}
              >
                <span className={styles.points}>
                  <span className="sr-only">At </span>
                  {cell.points}
                  <span className="sr-only"> points:</span>
                </span>
                <span className={styles.label}>{cell.name}</span>
              </li>
            ))}
          </ol>
          <p className={styles.note}>{verdict.note}</p>
        </>
      ) : (
        <div className={styles.closed}>
          <p
            className={styles.stamp}
            style={inkOf(verdict.kind === "closed" ? verdict.label : NEUTRAL)}
          >
            <span className={styles.label}>{verdict.name}</span>
          </p>
          <p className={styles.text}>{verdict.text}</p>
        </div>
      )}
      {figuresFrom && <p className={styles.note}>Figures from {figuresFrom}</p>}
      <Link className={styles.check} href={verdict.checkHref}>
        Check my points <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
