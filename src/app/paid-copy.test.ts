import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name))
      return [];
    return [full];
  });
}

/**
 * Lines from before the paid report (R11). The full report is paid (free for
 * founding readers) and its answers go to our server, so copy never says the
 * report is free or that answers only stay in the browser. "Your full profile
 * and points calculation stay in your browser" (the free check) is still true.
 */
const STALE = [
  /\b(your|the|full|personal) report (is|are) free\b/i,
  /\bfree,? personal report\b/i,
  /\bemail required\b/i,
  /\b(answers|profile) stays? in (your|this) browser\b/i,
  /\bkeep only your email\b/i,
];

describe("paid report copy", () => {
  it("never promises a free report or browser-only answers", () => {
    const offenders = sourceFiles(SRC).flatMap((file) => {
      const text = readFileSync(file, "utf8").replace(/\s+/g, " ");
      return STALE.filter((pattern) => pattern.test(text)).map(
        (pattern) => `${path.relative(SRC, file)}: ${pattern}`,
      );
    });
    expect(offenders).toEqual([]);
  });
});
