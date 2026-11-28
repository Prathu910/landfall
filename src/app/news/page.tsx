import Link from "next/link";
import { CalendarDays, ChevronRight, FileCheck2, ScanText } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import styles from "@/components/news/news.module.css";
import { NEWS_ARTICLES, NEWS_INDEX } from "@/lib/news/catalogue";
import { newsIndexJsonLd } from "@/lib/news/meta";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/page-meta";

export const metadata = pageMetadata({
  path: NEWS_INDEX.path,
  title: NEWS_INDEX.title,
  description: NEWS_INDEX.description,
});

export default function NewsPage() {
  return (
    <main id="main" className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(newsIndexJsonLd()) }}
      />
      <div className={styles.heroBand}>
        <div className={styles.shell}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight aria-hidden="true" />
            <span aria-current="page">News</span>
          </nav>
          <header className={styles.indexHero}>
            <p className={styles.kicker}>
              Australia, explained through the sources
            </p>
            <h1>
              Australian visa news.
              <br /> The changes that matter.
            </h1>
            <p>
              What changed, when it starts, and who it affects. Plain-language
              reporting with official sources and examples you can check.
            </p>
          </header>
        </div>
      </div>
      <section
        className={`${styles.shell} ${styles.listing}`}
        aria-labelledby="latest-news-heading"
      >
        <div className={styles.sectionHeading}>
          <h2 id="latest-news-heading">Latest news</h2>
          <p>Sources and review dates on every article</p>
        </div>
        {NEWS_ARTICLES.map((article) => (
          <NewsCard key={article.path} article={article} />
        ))}
      </section>
      <section className={styles.editorial} aria-label="How we report">
        <div className={`${styles.shell} ${styles.editorialGrid}`}>
          <div>
            <FileCheck2 aria-hidden="true" />
            <h2>Official sources first</h2>
            <p>
              Government announcements and legislation, linked so you can read
              the original.
            </p>
          </div>
          <div>
            <CalendarDays aria-hidden="true" />
            <h2>Dates made clear</h2>
            <p>
              The effective date and our review date are visible, so old news is
              easier to spot.
            </p>
          </div>
          <div>
            <ScanText aria-hidden="true" />
            <h2>Examples, with limits</h2>
            <p>
              Concrete figures and clear scope, including where an exemption or
              a different fee can apply.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
