import type { MetadataRoute } from "next";
import { robotsRules } from "../lib/robots-rules";
import { SITE_INDEXABLE, SITE_URL } from "../lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return robotsRules(SITE_INDEXABLE, SITE_URL);
}
