import type {
  InvitationRow,
  NominatedPanel,
} from "../../lib/report/panel-nominated";
import base from "./panel-189.module.css";
import styles from "./panel-nominated.module.css";
import { NoteWithLink } from "./note-with-link";
import { QueueBar } from "./queue-bar";

const TITLES = {
  "190": "190 · Skilled Nominated — in detail",
  "491": "491 · Skilled Work Regional — in detail",
} as const;

function isQuiet(row: InvitationRow): boolean {
  return row.text.startsWith("not published") || row.text.startsWith("none");
}

export function PanelNominated({
  panel,
  source,
}: {
  panel: NominatedPanel;
  source: string;
}) {
  const id = `visa-${panel.visa}`;
  const { whereYouStand } = panel;
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-heading`}
      className={base.panel}
    >
      <p className={base.eyebrow}>Subclass {panel.visa}</p>
      <h2 id={`${id}-heading`} className={base.h2}>
        {TITLES[panel.visa]}
      </h2>
      <p className={base.source}>{source}</p>
      <section className={base.block} aria-labelledby={`${id}-stand`}>
        <h3 id={`${id}-stand`} className={base.h3}>
          {panel.heading}
        </h3>
        {"unavailable" in whereYouStand ? (
          <p className={base.note}>{whereYouStand.unavailable}</p>
        ) : (
          <>
            <QueueBar segments={whereYouStand.segments} />
            <p className={base.lead}>{whereYouStand.sentence}</p>
            <NoteWithLink
              note={whereYouStand.queueNote}
              className={base.note}
            />
          </>
        )}
        <p className={base.note}>{panel.nationalNote}</p>
      </section>
      <section className={base.block} aria-labelledby={`${id}-invitations`}>
        <h3 id={`${id}-invitations`} className={base.h3}>
          {panel.invitationsHeading}
        </h3>
        <ul className={styles.rows}>
          {panel.invitations.map((row) => (
            <li
              key={row.month}
              className={`${styles.row} ${isQuiet(row) ? styles.quiet : ""}`}
            >
              <span className={styles.month}>{row.label}</span>
              <span className={styles.text}>{row.text}</span>
            </li>
          ))}
        </ul>
        <p className={styles.link}>
          <a href={panel.statesLink.href}>{panel.statesLink.text}</a>
        </p>
      </section>
    </section>
  );
}
