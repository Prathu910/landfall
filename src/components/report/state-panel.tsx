import type { Group } from "../../lib/state-outlook/outlook";
import type { CanApplyLine, StatePanel } from "../../lib/state-outlook/view";
import styles from "./state-panel.module.css";

const MARK_WORDS: Record<CanApplyLine["mark"], string> = {
  "✓": "Met",
  "✗": "Not met",
  "?": "Unanswered or unverified",
};

const MARK_CLASS: Record<CanApplyLine["mark"], string> = {
  "✓": styles.met,
  "✗": styles.unmet,
  "?": styles.open,
};

function Line({ line }: { line: CanApplyLine }) {
  return (
    <li className={`${styles.line} ${MARK_CLASS[line.mark]}`}>
      <span
        className={styles.mark}
        role="img"
        aria-label={MARK_WORDS[line.mark]}
      >
        {line.mark}
      </span>
      <span>
        <span className={styles.lineText}>{line.text}</span>
        <span className={styles.checked}>
          {line.checkedNote}
          {line.source ? (
            <>
              {" · "}
              <a href={line.source} target="_blank" rel="noreferrer">
                Official source (opens in a new tab)
              </a>
            </>
          ) : null}
        </span>
      </span>
    </li>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.block}>
      <h4 className={styles.h4}>{title}</h4>
      <ul className={styles.plain}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** One state's detail panel; closed on screen, expanded by the print rule. */
export function StatePanelView({
  panel,
  group,
}: {
  panel: StatePanel;
  group: Group;
}) {
  return (
    <details className={styles.panel} id={panel.id}>
      <summary className={styles.summary}>
        <span className={styles.header}>
          <span className={styles.heading}>{panel.heading}</span>
          <span className={`${styles.chip} ${styles[group]}`}>
            {panel.groupLabel}
          </span>
          {panel.streamName ? (
            <span className={styles.stream}>{panel.streamName}</span>
          ) : null}
        </span>
      </summary>
      <div className={styles.body}>
        <div className={styles.block}>
          <h4 className={styles.h4}>Can you apply?</h4>
          <ul className={styles.plain}>
            {panel.canApply.map((line) => (
              <Line key={`${line.mark}${line.text}`} line={line} />
            ))}
          </ul>
        </div>
        <List title="What the data shows" items={panel.data} />
        <List title="Your points there" items={panel.pointsThere} />
        {panel.resultsLink ? (
          <p className={styles.results}>
            <a href={panel.resultsLink.href} target="_blank" rel="noreferrer">
              {panel.resultsLink.text}
            </a>
          </p>
        ) : null}
        <p className={styles.footer}>{panel.footer}</p>
      </div>
    </details>
  );
}
