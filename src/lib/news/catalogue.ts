import { VISA_FEE_ARTICLE } from "../../data/news/onshore-visa-fee-increase-2026";
import type { NewsArticle } from "./types";

export const NEWS_INDEX = {
  path: "/news/",
  title: "Australian visa news and changes",
  description:
    "Australian visa news explained with official sources: fee changes, who is affected, what changed and when, plus practical examples from MigrateLens.",
} as const;

/** Add reviewed articles here; the index, sitemap and collection share this list. */
export const NEWS_ARTICLES: readonly NewsArticle[] = [VISA_FEE_ARTICLE];
