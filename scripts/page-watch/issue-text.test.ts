import { describe, expect, it } from "vitest";
import { MAX_BODY } from "../automation/failure-issue";
import {
  cannotReadMarker,
  markersIn,
  plain,
  standingBody,
  watchMarker,
  withExcerpt,
} from "./issue-text";

describe("markersIn", () => {
  it("reads markers on their own lines outside fences", () => {
    const body = [
      watchMarker("https://a.gov.au/"),
      "````diff",
      watchMarker("https://quoted.gov.au/"),
      "```",
      watchMarker("https://still-quoted.gov.au/"),
      "````",
      `text ${watchMarker("https://inline.gov.au/")}`,
      cannotReadMarker("https://b.gov.au/"),
      watchMarker("https://c.gov.au/"),
    ].join("\n");
    expect([...markersIn(body, "watch-url")]).toEqual([
      "https://a.gov.au/",
      "https://c.gov.au/",
    ]);
    expect([...markersIn(body, "cannot-read")]).toEqual(["https://b.gov.au/"]);
  });
});

describe("withExcerpt", () => {
  it("shortens a huge excerpt but keeps the closing fence", () => {
    const body = withExcerpt(
      "head",
      `${"```".repeat(2)}\n${"x".repeat(MAX_BODY * 2)}`,
    );
    expect(body.length).toBeLessThanOrEqual(MAX_BODY);
    const fence = /^(`+)diff$/m.exec(body)![1];
    expect(fence.length).toBeGreaterThan(6);
    expect(body.endsWith(`\n(truncated)\n${fence}`)).toBe(true);
  });
});

describe("plain", () => {
  it("flattens and disarms page text", () => {
    expect(plain("Fees\n\t@team\u0007 now", 100)).toBe("Fees ＠team now");
    expect(plain("a".repeat(20), 10)).toBe(`${"a".repeat(9)}…`);
  });
});

describe("standingBody", () => {
  it("marks each page and says when there are none", () => {
    const source = { url: "https://act.gov.au/x", citedBy: [] };
    const body = standingBody([{ source, reason: "HTTP 403" }], "2026-12-04");
    expect(body).toContain(cannotReadMarker(source.url));
    expect(body).toContain("- https://act.gov.au/x: HTTP 403");
    expect(standingBody([], "2026-12-04")).toContain("None right now");
  });
});
