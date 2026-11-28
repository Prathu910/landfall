import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FeeChangeArtwork } from "@/components/news/fee-change-artwork";
import { FeeComparison } from "@/components/news/fee-comparison";
import { NewsSources } from "@/components/news/news-sources";
import { VisaFeeExplainer } from "@/components/news/visa-fee-explainer";
import { VisaFeeScope } from "@/components/news/visa-fee-scope";
import styles from "@/components/news/news.module.css";
import {
  FEE_FAQ,
  FEE_SOURCE_URLS,
  VISA_FEE_ARTICLE as article,
} from "@/data/news/onshore-visa-fee-increase-2026";
import { newsArticleJsonLd } from "@/lib/news/meta";
import { faqPageLd, serializeJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/page-meta";

export const metadata = pageMetadata({
  path: article.path,
  title: article.seoTitle,
  description: article.description,
  type: "article",
  publishedTime: article.publishedAt,
  modifiedTime: article.updatedAt,
  image: {
    url: article.image,
    alt: article.imageAlt,
    width: 1200,
    height: 630,
  },
});

const CONTENTS = [
  ["before-and-after", "Before and after"],
  ["who-pays", "Who pays"],
  ["exemptions", "Exemptions"],
  ["families", "Family applications"],
  ["check-your-fee", "Check your fee"],
  ["questions", "Common questions"],
  ["sources", "Official sources"],
] as const;

export default function OnshoreVisaFeeArticle() {
  return (
    <main id="main" className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd([
            ...newsArticleJsonLd(article),
            faqPageLd([...FEE_FAQ]),
          ]),
        }}
      />
      <article aria-labelledby="article-heading">
        <div className={styles.heroBand}>
          <div className={styles.shell}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight aria-hidden="true" />
              <Link href="/news/">News</Link>
              <ChevronRight aria-hidden="true" />
              <span aria-current="page">Onshore visa fees</span>
            </nav>
            <header className={styles.articleHero}>
              <div>
                <p className={styles.kicker}>
                  Visa fees <span>· Effective 28 November 2026</span>
                </p>
                <h1 id="article-heading">{article.title}</h1>
                <p className={styles.intro}>
                  From <strong>28 November 2026</strong>, specified visa
                  applications made in Australia attract an extra{" "}
                  <strong>AUD 1,500 per affected applicant</strong>. The{" "}
                  <a href={FEE_SOURCE_URLS.amendment}>
                    Australian Government’s new regulations
                  </a>{" "}
                  cover certain graduate, student, partner and family
                  applications, with exemptions.
                </p>
                <div className={styles.byline}>
                  <span>
                    By <Link href="/about/">MigrateLens</Link>
                  </span>
                  <span>
                    Published{" "}
                    <time dateTime={article.publishedAt}>28 Nov 2026</time>
                  </span>
                  <span>
                    Reviewed{" "}
                    <time dateTime={article.updatedAt}>28 Nov 2026</time>
                  </span>
                </div>
              </div>
              <FeeChangeArtwork decorative />
            </header>
          </div>
        </div>
        <div className={`${styles.shell} ${styles.articleGrid}`}>
          <aside className={styles.contents} aria-labelledby="contents-heading">
            <nav aria-label="In this article">
              <h2 id="contents-heading">In this article</h2>
              <ol>
                {CONTENTS.map(([id, label]) => (
                  <li key={id}>
                    <a href={`#${id}`}>{label}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>
          <div className={styles.articleContent}>
            <FeeComparison />
            <VisaFeeScope />
            <VisaFeeExplainer />
            <NewsSources />
            <aside className={styles.related} aria-labelledby="related-heading">
              <h2 id="related-heading">
                Planning a skilled migration pathway?
              </h2>
              <p>
                The 189, 190 and 491 are outside this new charge. Explore how
                those pathways work, or check your points against published
                SkillSelect data.
              </p>
              <div className={styles.relatedLinks}>
                <Link href="/guide/">Read the skilled visa guide</Link>
                <Link href="/check/">Check my points</Link>
                <Link href="/news/">All visa news</Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}
