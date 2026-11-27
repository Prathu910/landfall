import type { MetadataRoute } from "next";

/**
 * Paths never crawled even when the site is indexable: /report/ is a private,
 * token-only page (paid report spec, "New and changed pages").
 */
export const PRIVATE_PATHS = ["/report/"];

/** Search and answer engines that cite and link back (audit A-P2-4). */
export const SEARCH_AGENTS = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
];

/**
 * Model-training crawlers, allowed too (ruling R4, 26 Nov 2026): the data is
 * public government data, and being known to models is how unprompted
 * citations happen.
 */
export const TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

/**
 * robots.txt for the launch switch: allow everything once indexable, else
 * nothing. Named crawlers get their own groups so the policy is explicit; a
 * crawler obeys only its own group, so each one repeats the private paths.
 */
export function robotsRules(
  indexable: boolean,
  siteUrl: string,
): MetadataRoute.Robots {
  const open = { allow: "/", disallow: PRIVATE_PATHS };
  return {
    rules: indexable
      ? [
          { userAgent: "*", ...open },
          { userAgent: SEARCH_AGENTS, ...open },
          { userAgent: TRAINING_AGENTS, ...open },
        ]
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
