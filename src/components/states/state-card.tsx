import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { StateCard as Card } from "@/lib/states-page/state-cards";
import styles from "./state-card.module.css";

const VISA_NAMES = {
  "190": "Skilled Nominated (190)",
  "491": "Skilled Work Regional (491)",
} as const;

/** One state or territory: the key facts at a glance, the summary on tap. */
export function StateCard({ card }: { card: Card }) {
  const nameId = `${card.anchor}-name`;
  return (
    <article id={card.anchor} className={styles.card} aria-labelledby={nameId}>
      <header className={styles.top}>
        <span className={styles.code} aria-hidden="true">
          {card.code}
        </span>
        <div>
          <h2 id={nameId}>{card.name}</h2>
          <p className={styles.system}>{card.system}</p>
        </div>
      </header>
      <dl className={styles.facts}>
        {card.visas.map(({ visa, lines }) => (
          <div key={visa}>
            <dt>{VISA_NAMES[visa]}</dt>
            <dd>
              <ul>
                {lines.map((line) => (
                  <li key={line.status}>
                    <span className={styles.status} data-status={line.status}>
                      {line.label}
                    </span>
                    {line.who && <span>{line.who}</span>}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
        <div>
          <dt>Occupation list</dt>
          <dd>
            <span
              className={styles.status}
              data-status={card.occupationList.checked ? "list" : "checking"}
            >
              {card.occupationList.text}
            </span>
          </dd>
        </div>
      </dl>
      <details className={styles.more}>
        <summary>
          How {card.name} selects
          <ChevronDown size={18} aria-hidden className={styles.chevron} />
        </summary>
        <div className={styles.moreBody}>
          <p>{card.summary}</p>
          <h3>What changes the picture</h3>
          <p>{card.considerations}</p>
        </div>
      </details>
      <footer className={styles.foot}>
        <a href={card.url} target="_blank" rel="noreferrer">
          Read the official criteria <ArrowUpRight size={14} aria-hidden />
        </a>
        <span>{card.checked}</span>
      </footer>
    </article>
  );
}
