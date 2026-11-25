import type { MetadataRoute } from "next";

/**
 * Paths never crawled even when the site is indexable: /report/ is a private,
 * token-only page (paid report spec, "New and changed pages").
 */
export const PRIVATE_PATHS = ["/report/"];

/** robots.txt for the launch switch: allow everything once indexable, else nothing. */
export function robotsRules(
  indexable: boolean,
  siteUrl: string,
): MetadataRoute.Robots {
  return {
    rules: indexable
      ? { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
