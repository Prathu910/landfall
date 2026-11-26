import { describe, expect, it } from "vitest";
import { GET } from "./llms.txt/route";
import sitemap from "./sitemap";

describe("/llms.txt", () => {
  it("links only pages the build publishes in the sitemap", async () => {
    const text = await GET().text();
    const urls = [...text.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
      (m) => m[1],
    );
    expect(urls.length).toBeGreaterThan(8);
    const published = new Set(sitemap().map((entry) => entry.url));
    expect(urls.filter((url) => !published.has(url))).toEqual([]);
  });
  it("states the data date, the not-advice line and the contact", async () => {
    const text = await GET().text();
    expect(text).toMatch(/^# MigrateLens\n/);
    expect(text).toMatch(/Data as at \d{1,2} [A-Z][a-z]{2} \d{4}/);
    expect(text).toContain("not migration advice");
    expect(text).toContain("hello@migratelens.com");
    expect(text).toContain("not individuals");
  });
});
