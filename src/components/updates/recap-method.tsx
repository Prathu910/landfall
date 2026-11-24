import Link from "next/link";
import type { MethodView } from "@/lib/updates/method-view";
import { RecapBand, type BandTone } from "./recap-band";
import parts from "./recap-parts.module.css";
import styles from "./recap-method.module.css";

const HEADING_ID = "method-heading";

/** The sources of the sections shown, the reading notes and the method link. */
export function RecapMethod({
  tone,
  method,
}: {
  tone: BandTone;
  method: MethodView;
}) {
  return (
    <RecapBand id="method" tone={tone} labelledBy={HEADING_ID}>
      <h2 id={HEADING_ID} className={parts.kicker}>
        Method and sources
      </h2>
      <ul className={styles.sources}>
        {method.sources.map((source) => (
          <li key={source.label}>
            {source.text} <a href={source.href}>{source.label}</a>
          </li>
        ))}
      </ul>
      <p className={styles.notes}>
        {method.notes.join(" ")}{" "}
        <Link href={method.link.href}>{method.link.text}</Link>
      </p>
    </RecapBand>
  );
}
