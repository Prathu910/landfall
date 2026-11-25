import { describe, expect, it } from "vitest";
import { diffLines } from "./diff-lines";

describe("diffLines", () => {
  it("lists removed and added lines in page order", () => {
    expect(diffLines("a\nb\nc\nd", "a\nB\nc\nd\ne", 40)).toEqual({
      lines: ["- b", "+ B", "+ e"],
      total: 3,
    });
  });

  it("stops at the limit and counts the rest", () => {
    const before = Array.from({ length: 100 }, (_, i) => `old ${i}`).join("\n");
    const after = Array.from({ length: 100 }, (_, i) => `new ${i}`).join("\n");
    const diff = diffLines(before, after, 40);
    expect(diff.lines).toHaveLength(40);
    expect(diff.total).toBe(200);
  });

  it("falls back to a set difference for very long pages", () => {
    const before = Array.from({ length: 5000 }, (_, i) => `row ${i}`);
    const after = [...before];
    after[10] = "row ten";
    after[4000] = "row four thousand";
    const diff = diffLines(before.join("\n"), after.join("\n"), 40);
    expect(diff.total).toBe(4);
    expect(diff.lines).toEqual([
      "- row 10",
      "- row 4000",
      "+ row ten",
      "+ row four thousand",
    ]);
  });

  it("shortens very long lines", () => {
    const diff = diffLines("a", "b".repeat(1000), 40);
    expect(diff.lines[1].length).toBeLessThanOrEqual(305);
  });
});
