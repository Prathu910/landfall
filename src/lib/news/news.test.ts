import { describe, expect, it } from "vitest";
import {
  FEE_EXAMPLES,
  FEE_SOURCES,
  ONSHORE_CHARGE,
  VISA_FEE_ARTICLE,
} from "../../data/news/onshore-visa-fee-increase-2026";
import { NEWS_ARTICLES, NEWS_INDEX } from "./catalogue";
import {
  SITE_NAVIGATION,
  isNavigationActive,
} from "../../components/site-navigation";
import { buildLlmsTxt } from "../seo/llms-txt";
import { newsArticleJsonLd, newsIndexJsonLd, newsSitemapEntries } from "./meta";

const ARTICLE_PATH = "/news/onshore-visa-fee-increase-2026/";
const SITE = "https://migratelens.com";

describe("the onshore charge article", () => {
  it("links its real news card to the exact article destination used in the reel", () => {
    expect(NEWS_INDEX.path).toBe("/news/");
    expect(NEWS_ARTICLES).toContain(VISA_FEE_ARTICLE);
    expect(VISA_FEE_ARTICLE.path).toBe(ARTICLE_PATH);
    expect(VISA_FEE_ARTICLE.effectiveAt).toBe("2026-11-28");
    expect(VISA_FEE_ARTICLE.updatedAt).toBe("2026-11-28");
  });

  it("keeps the three published standard main-applicant examples separate", () => {
    expect(ONSHORE_CHARGE).toBe(1500);
    expect(
      FEE_EXAMPLES.map(({ visa, before, after }) => ({ visa, before, after })),
    ).toEqual([
      { visa: "485", before: 5750, after: 7250 },
      { visa: "500", before: 2500, after: 4000 },
      { visa: "820/801", before: 11710, after: 13210 },
    ]);
    for (const example of FEE_EXAMPLES) {
      expect(example.after - example.before).toBe(ONSHORE_CHARGE);
      expect(example.scope).toMatch(/standard|first/i);
      expect(FEE_SOURCES.some((source) => source.id === example.sourceId)).toBe(
        true,
      );
    }
  });

  it("uses government evidence and does not present an agency as the source", () => {
    expect(FEE_SOURCES.length).toBeGreaterThanOrEqual(3);
    for (const source of FEE_SOURCES) {
      expect(new URL(source.url).hostname).toMatch(/(^|\.)gov\.au$/);
      expect(source.checkedAt).toBe(VISA_FEE_ARTICLE.updatedAt);
    }
    expect(
      FEE_SOURCES.some((source) => source.url.includes("F2026L01607")),
    ).toBe(true);
  });
});

describe("news discovery and search metadata", () => {
  it("is discoverable in navigation and the public reading index", () => {
    expect(SITE_NAVIGATION).toContainEqual({ href: "/news/", label: "News" });
    expect(isNavigationActive(ARTICLE_PATH, "/news/")).toBe(true);
    const text = buildLlmsTxt({
      asAt: "2026-10",
      occupationCount: 479,
      latestRecap: "2026-10",
    });
    expect(text).toContain(`${SITE}/news/`);
    expect(text).toContain(SITE + ARTICLE_PATH);
  });
  it("gives the article a sourced NewsArticle entity and correct breadcrumb", () => {
    const nodes = newsArticleJsonLd(VISA_FEE_ARTICLE);
    expect(nodes).toContainEqual(
      expect.objectContaining({
        "@type": "NewsArticle",
        url: SITE + ARTICLE_PATH,
        datePublished: "2026-11-28",
        dateModified: "2026-11-28",
        citation: FEE_SOURCES.map((source) => source.url),
        image: SITE + VISA_FEE_ARTICLE.image,
      }),
    );
    expect(nodes).toContainEqual(
      expect.objectContaining({
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "MigrateLens",
            item: `${SITE}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "News",
            item: `${SITE}/news/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: VISA_FEE_ARTICLE.shortTitle,
            item: SITE + ARTICLE_PATH,
          },
        ],
      }),
    );
  });

  it("lists only actual article URLs in its CollectionPage", () => {
    expect(newsIndexJsonLd()).toContainEqual(
      expect.objectContaining({
        "@type": "CollectionPage",
        url: `${SITE}/news/`,
        mainEntity: expect.objectContaining({
          itemListElement: [
            expect.objectContaining({ url: SITE + ARTICLE_PATH }),
          ],
        }),
      }),
    );
  });

  it("dates the news index by the latest article revision, not its effective date", () => {
    const revised = { ...VISA_FEE_ARTICLE, updatedAt: "2026-12-02" };
    expect(newsSitemapEntries([revised])).toEqual([
      { url: `${SITE}/news/`, lastModified: "2026-12-02" },
      { url: SITE + ARTICLE_PATH, lastModified: "2026-12-02" },
    ]);
  });

  it("keeps search descriptions unique and within the existing snippet budget", () => {
    expect(NEWS_INDEX.description).not.toBe(VISA_FEE_ARTICLE.description);
    for (const page of [NEWS_INDEX, VISA_FEE_ARTICLE]) {
      expect(page.description.length).toBeGreaterThanOrEqual(120);
      expect(page.description.length).toBeLessThanOrEqual(160);
    }
  });
});
