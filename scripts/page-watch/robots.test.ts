import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { USER_AGENT } from "../state-lists/shared";
import { isAllowed, parseRobots, productToken } from "./robots";

const robots = readFileSync(
  join(__dirname, "__fixtures__", "robots.txt"),
  "utf8",
);
const site = "https://www.example.gov.au";

describe("productToken", () => {
  it("is the first token of the User-Agent", () => {
    expect(productToken(USER_AGENT)).toBe("Mozilla");
  });
});

describe("parseRobots", () => {
  const rules = parseRobots(robots, "Mozilla");

  it("keeps the * group and the group naming our product token, case-insensitively", () => {
    expect(rules).toContainEqual({ allow: false, pattern: "/core/" });
    expect(rules).toContainEqual({ allow: false, pattern: "/private/" });
    expect(rules).not.toContainEqual({ allow: false, pattern: "/search/" });
  });

  it("ignores comments, unknown lines and an empty Disallow", () => {
    expect(rules.every((rule) => rule.pattern !== "")).toBe(true);
    expect(rules).toHaveLength(6);
  });

  it("finds no rules in an empty or missing file", () => {
    expect(parseRobots("", "Mozilla")).toEqual([]);
    expect(isAllowed([], `${site}/anything`)).toBe(true);
  });
});

describe("isAllowed", () => {
  const rules = parseRobots(robots, "Mozilla");
  const allowed = (path: string) => isAllowed(rules, `${site}${path}`);

  it("skips disallowed paths and keeps the rest", () => {
    expect(allowed("/visas/skilled")).toBe(true);
    expect(allowed("/core/misc/drupal.js")).toBe(false);
    expect(allowed("/private/page")).toBe(false);
    expect(allowed("/search/results")).toBe(true);
  });

  it("lets the longest rule win, and Allow win a tie", () => {
    expect(allowed("/admin/config")).toBe(false);
    expect(allowed("/admin/help/topics")).toBe(true);
    const tie = [
      { allow: false, pattern: "/page" },
      { allow: true, pattern: "/page" },
    ];
    expect(isAllowed(tie, `${site}/page`)).toBe(true);
  });

  it("supports * and a $ end anchor, matching the query string", () => {
    expect(allowed("/occupation-search?combine=&_format=csv")).toBe(false);
    expect(allowed("/occupation-search?_format=csv&page=2")).toBe(true);
    expect(allowed("/news/2026/print")).toBe(false);
    expect(allowed("/news/2026/story")).toBe(true);
  });

  it("treats regex characters in a pattern literally", () => {
    const rules = [{ allow: false, pattern: "/a.b(c)" }];
    expect(isAllowed(rules, `${site}/a.b(c)`)).toBe(false);
    expect(isAllowed(rules, `${site}/axb(c)`)).toBe(true);
  });
});
