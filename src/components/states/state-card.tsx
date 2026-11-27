import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import type { StateCard as Card } from "@/lib/states-page/state-cards";
import styles from "./state-card.module.css";

const VISA_NAMES = {
  "190": "Skilled Nominated (190)",
  "491": "Skilled Work Regional (491)",
} as const;

/**
 * One state or territory: the key facts at a glance, the summary on tap.
 * `dataLink` adds the link to the state's own page; a state page nests the
 * card under its own h2, so it asks for an h3.
 */
export function StateCard({
  card,
  dataLink,
  headingLevel = 2,
}: {
  card: Card;
  dataLink?: { href: string; text: string };
  headingLevel?: 2 | 3;
}) {
  const nameId = `${card.anchor}-name`;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const Subheading = headingLevel === 2 ? "h3" : "h4";
  return (
    <article id={card.anchor} className={styles.card} aria-labelledby={nameId}>
      <header className={styles.top}>
        <span className={styles.code} aria-hidden="true">
          {card.code}
        </span>
        <div>
          <Heading id={nameId}>{card.name}</Heading>
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
          <Subheading>What changes the picture</Subheading>
          <p>{card.considerations}</p>
        </div>
      </details>
      {dataLink && (
        <Link href={dataLink.href} className={styles.dataLink}>
          {dataLink.text} <ArrowRight size={14} aria-hidden />
        </Link>
      )}
      <footer className={styles.foot}>
        <a href={card.url} target="_blank" rel="noreferrer">
          Read the official criteria <ArrowUpRight size={14} aria-hidden />
        </a>
        <span>{card.checked}</span>
      </footer>
    </article>
  );
}
