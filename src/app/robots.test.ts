import { describe, expect, it } from "vitest";
import {
  robotsRules,
  SEARCH_AGENTS,
  TRAINING_AGENTS,
} from "../lib/robots-rules";
import { SITE_INDEXABLE, SITE_URL } from "../lib/site";
import robots from "./robots";

type Rule = { userAgent?: string | string[]; disallow?: string | string[] };
const groups = (indexable: boolean): Rule[] =>
  [robotsRules(indexable, SITE_URL).rules].flat() as Rule[];

describe("robots", () => {
  it("allows everything but /report/ when indexable, and nothing when not", () => {
    expect(groups(true)[0]).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/report/"],
    });
    expect(groups(false)).toEqual([{ userAgent: "*", disallow: "/" }]);
  });

  it("names the AI search and training crawlers explicitly", () => {
    const agents = groups(true).flatMap((g) => [g.userAgent ?? []].flat());
    for (const bot of [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-SearchBot",
      "PerplexityBot",
      "Google-Extended",
      "Applebot-Extended",
      "CCBot",
    ]) {
      expect(agents).toContain(bot);
    }
    expect(agents).toEqual(["*", ...SEARCH_AGENTS, ...TRAINING_AGENTS]);
  });

  it("disallows /report/ in every group, since a crawler reads only its own", () => {
    for (const indexable of [true, false]) {
      for (const group of groups(indexable)) {
        const disallow = [group.disallow ?? []].flat();
        expect(
          disallow.some((path) => path === "/report/" || path === "/"),
        ).toBe(true);
      }
    }
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
