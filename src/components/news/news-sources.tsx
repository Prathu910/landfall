import { FEE_SOURCES } from "@/data/news/onshore-visa-fee-increase-2026";
import styles from "./news.module.css";

export function NewsSources() {
  return (
    <section
      id="sources"
      className={styles.section}
      aria-labelledby="sources-heading"
    >
      <p className={styles.kicker}>Follow the evidence</p>
      <h2 id="sources-heading">Official sources and review date</h2>
      <p>
        Reviewed against the sources below on{" "}
        <time dateTime="2026-11-28">28 November 2026</time>. The fee examples
        combine the existing Schedule 1 amounts with the new amendment; the
        older compilation alone does not show the new charge.
      </p>
      <ol className={styles.sources}>
        {FEE_SOURCES.map((source) => (
          <li key={source.id}>
            <a href={source.url}>{source.title}</a>
            <p>{source.detail}</p>
          </li>
        ))}
      </ol>
      <p className={styles.note}>
        This article provides general information, not personal migration
        advice. Found an error?{" "}
        <a href="mailto:hello@migratelens.com">Email hello@migratelens.com</a>{" "}
        with the source so we can review it.
      </p>
    </section>
  );
}
