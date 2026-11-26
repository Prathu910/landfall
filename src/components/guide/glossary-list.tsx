import type { GlossaryTerm } from "@/lib/guide/glossary";
import { GuideLink } from "./guide-link";
import styles from "./glossary-list.module.css";

/** Glossary terms, each at its own anchor with its definition and source. */
export function GlossaryList({ terms }: { terms: GlossaryTerm[] }) {
  return (
    <dl className={styles.list}>
      {terms.map((term) => (
        <div key={term.id} id={term.id} className={styles.term}>
          <dt>
            <dfn>{term.term}</dfn>
          </dt>
          <dd>
            <p>{term.definition}</p>
            <p className={styles.source}>
              Source:{" "}
              <GuideLink href={term.source.href}>{term.source.label}</GuideLink>
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}
