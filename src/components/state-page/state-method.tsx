import Link from "next/link";
import type { StateCode } from "@/lib/data/types";
import type { StatePageView } from "@/lib/state-page/view";
import { RecapBand, type BandTone } from "@/components/updates/recap-band";
import parts from "@/components/updates/recap-parts.module.css";
import { StateLinks } from "./state-links";
import styles from "./state-method.module.css";

const HEADING_ID = "method-heading";

/** How to read the page's numbers, its sources, and the other states. */
export function StateMethod({
  tone,
  method,
  sources,
  current,
}: {
  tone: BandTone;
  method: StatePageView["method"];
  sources: { text: string; href: string }[];
  current: StateCode;
}) {
  return (
    <RecapBand id="method" tone={tone} labelledBy={HEADING_ID}>
      <p className={parts.kicker}>Method and sources</p>
      <h2 id={HEADING_ID} className={parts.heading}>
        How to read these numbers
      </h2>
      <ul className={styles.notes}>
        {method.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <p className={styles.links}>
        {sources.map((source) => (
          <a key={source.href} href={source.href} rel="noreferrer">
            {source.text}
          </a>
        ))}
        {method.links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.text}
          </Link>
        ))}
      </p>
      <h3 className={styles.subhead}>Other states and territories</h3>
      <StateLinks current={current} />
    </RecapBand>
  );
}
