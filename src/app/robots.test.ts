import { describe, expect, it } from "vitest";
import { SITE_INDEXABLE, SITE_URL } from "../lib/site";
import robots from "./robots";

describe("robots", () => {
  it("disallows everything while the site is not indexable", () => {
    expect(SITE_INDEXABLE).toBe(false);
    const result = robots();
    expect(result.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
