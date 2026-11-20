import type { MetadataRoute } from "next";

/** robots.txt for the launch switch: allow everything once indexable, else nothing. */
export function robotsRules(
  indexable: boolean,
  siteUrl: string,
): MetadataRoute.Robots {
  return {
    rules: indexable
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
