import { describe, expect, it } from "vitest";
import { robotsRules } from "../lib/robots-rules";
import { SITE_INDEXABLE, SITE_URL } from "../lib/site";
import robots from "./robots";

describe("robots", () => {
  it("allows everything when indexable and blocks everything when not", () => {
    expect(robotsRules(true, SITE_URL).rules).toEqual({
      userAgent: "*",
      allow: "/",
    });
    expect(robotsRules(false, SITE_URL).rules).toEqual({
      userAgent: "*",
      disallow: "/",
    });
  });

  it("follows the launch switch and points to the sitemap", () => {
    const result = robots();
    expect(result).toEqual(robotsRules(SITE_INDEXABLE, SITE_URL));
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it("is open to search engines since the launch", () => {
    expect(SITE_INDEXABLE).toBe(true);
  });
});
