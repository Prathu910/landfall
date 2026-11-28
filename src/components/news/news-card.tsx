import Link from "next/link";
import { VISA_FEE_ARTICLE } from "@/data/news/onshore-visa-fee-increase-2026";
import type { NewsArticle } from "@/lib/news/types";
import { FeeChangeArtwork } from "./fee-change-artwork";
import styles from "./news.module.css";

export function NewsCard({ article }: { article: NewsArticle }) {
  const headingId = `news-${article.path.split("/").filter(Boolean).at(-1)}`;
  const publishedDate = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(article.publishedAt));
  return (
    <article>
      <Link
        href={article.path}
        className={styles.newsCard}
        aria-labelledby={headingId}
      >
        <div className={styles.cardArtwork}>
          {article.path === VISA_FEE_ARTICLE.path && (
            <FeeChangeArtwork decorative />
          )}
        </div>
        <div className={styles.cardBody}>
          <p className={styles.kicker}>
            {article.category}{" "}
            <span>
              · <time dateTime={article.publishedAt}>{publishedDate}</time>
            </span>
          </p>
          <h3 id={headingId}>{article.title}</h3>
          <p>{article.summary}</p>
          {article.path === VISA_FEE_ARTICLE.path && (
            <div className={styles.cardFacts}>
              <span>Graduate 485</span>
              <span>Student 500</span>
              <span>Onshore partner</span>
            </div>
          )}
          <span className={styles.cardLink}>Read the fee breakdown</span>
        </div>
      </Link>
    </article>
  );
}
