import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A monthly import changes the live SkillSelect data. Tests that assert
 * specific figures or labels read the frozen 2026-10 snapshot instead; only
 * the invariants below (which should stop a bad month) read live data.
 * Paths are relative to src/lib/.
 */
const LIVE_INVARIANT_TESTS = new Set([
  "occupation-page/copy-sweep.test.ts",
  "occupation-page/slug.test.ts",
  "outlook/sweep-60.test.ts",
  "outlook/sweep-70.test.ts",
  "outlook/sweep-80.test.ts",
  "outlook/sweep-90.test.ts",
  "report-evidence.test.ts",
]);

const LIVE_LOADER_NAMES =
  /\b(loadOccupationCore|loadOccupationDetail|loadManifest)\b/;
const LIVE_IMPORTS = [
  /from\s+["'][^"']*occupation-index(\.json)?["']/,
  /from\s+["'][^"']*__fixtures__\/sweep["']/,
];

const LIB = path.join(process.cwd(), "src", "lib");

function testFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return testFiles(full);
    return /\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Does the file read the live SkillSelect loaders or index? */
function readsLiveData(source: string): boolean {
  const loadServerImports = source.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*["'][^"']*load-server["']/g,
  );
  for (const match of loadServerImports) {
    if (LIVE_LOADER_NAMES.test(match[1])) return true;
  }
  return LIVE_IMPORTS.some((pattern) => pattern.test(source));
}

describe("tests that read live SkillSelect data", () => {
  const files = testFiles(LIB).map((file) => ({
    rel: path.relative(LIB, file).split(path.sep).join("/"),
    source: readFileSync(file, "utf8"),
  }));

  it("are only the listed invariant tests", () => {
    const offenders = files
      .filter(({ rel }) => rel !== "data/live-data-tests.test.ts")
      .filter(({ source }) => readsLiveData(source))
      .map(({ rel }) => rel)
      .filter((rel) => !LIVE_INVARIANT_TESTS.has(rel));
    expect(offenders).toEqual([]);
  });

  it("never reaches live data through the shared outlook fixtures", () => {
    for (const name of ["scenario-input", "review-profiles"]) {
      const fixture = readFileSync(
        path.join(LIB, "outlook", "__fixtures__", `${name}.ts`),
        "utf8",
      );
      expect(readsLiveData(fixture), name).toBe(false);
    }
  });

  it("lists only files that still read live data", () => {
    const stale = [...LIVE_INVARIANT_TESTS].filter((rel) => {
      const file = files.find((f) => f.rel === rel);
      return !file || !readsLiveData(file.source);
    });
    expect(stale).toEqual([]);
  });
});
