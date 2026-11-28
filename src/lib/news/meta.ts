import { SITE_NAME, SITE_URL } from "../site";
import { breadcrumbLd, collectionPageLd, newsArticleLd } from "../seo/json-ld";
import { NEWS_ARTICLES, NEWS_INDEX } from "./catalogue";
import type { NewsArticle } from "./types";

export function newsArticleJsonLd(article: NewsArticle): object[] {
  const url = SITE_URL + article.path;
  return [
    newsArticleLd({
      headline: article.title,
      description: article.description,
      url,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      citations: article.sources.map((source) => source.url),
      image: SITE_URL + article.image,
    }),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: "News", item: SITE_URL + NEWS_INDEX.path },
      { name: article.shortTitle, item: url },
    ]),
  ];
}

export function newsIndexJsonLd(): object[] {
  const url = SITE_URL + NEWS_INDEX.path;
  return [
    collectionPageLd({
      name: NEWS_INDEX.title,
      description: NEWS_INDEX.description,
      url,
      items: NEWS_ARTICLES.map((article) => ({
        name: article.title,
        url: SITE_URL + article.path,
      })),
    }),
    breadcrumbLd([
      { name: SITE_NAME, item: `${SITE_URL}/` },
      { name: "News", item: url },
    ]),
  ];
}

export function newsSitemapEntries(
  articles: readonly NewsArticle[] = NEWS_ARTICLES,
): { url: string; lastModified: string }[] {
  const lastModified = articles
    .map((article) => article.updatedAt)
    .sort()
    .at(-1);
  return [
    {
      url: SITE_URL + NEWS_INDEX.path,
      lastModified: lastModified ?? "2026-11-28",
    },
    ...articles.map((article) => ({
      url: SITE_URL + article.path,
      lastModified: article.updatedAt,
    })),
  ];
}
