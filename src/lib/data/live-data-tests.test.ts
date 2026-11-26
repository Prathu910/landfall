import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A monthly import changes the live SkillSelect data. Tests that assert
 * specific figures or labels read the frozen 2026-10 snapshot instead; only
 * the invariants below (which should stop a bad month) read live data.
 * Paths are relative to the repository root.
 */
const LIVE_INVARIANT_TESTS = new Set([
  "scripts/import/generate-rounds.test.ts",
  "scripts/social/title-fit.test.ts",
  "scripts/updates/generate.test.ts",
  "src/lib/occupation-page/copy-sweep.test.ts",
  "src/lib/occupation-page/slug.test.ts",
  "src/lib/outlook/sweep-60.test.ts",
  "src/lib/outlook/sweep-70.test.ts",
  "src/lib/outlook/sweep-80.test.ts",
  "src/lib/outlook/sweep-90.test.ts",
  "src/lib/report-evidence.test.ts",
  "src/lib/state-page/copy-sweep.test.ts",
  "src/lib/state-page/live.test.ts",
]);

const LIVE_LOADER_NAMES =
  /\b(loadOccupationCore|loadOccupationDetail|loadManifest)\b/;
const LIVE_IMPORTS = [
  /from\s+["'][^"']*occupation-index(\.json)?["']/,
  /from\s+["'][^"']*__fixtures__\/sweep["']/,
  /from\s+["'][^"']*data\/manifest\.json["']/,
  /["']src\/data\/manifest\.json["']/,
  /\bloadAllCores\b/,
  /\bloadStatePageViews\b/,
];

const ROOT = process.cwd();
const SCANNED = ["src/lib", "scripts"];

function testFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return testFiles(full);
    return /\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Does the file read the live SkillSelect loaders, manifest, cores or index? */
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
  const files = SCANNED.flatMap((dir) => testFiles(path.join(ROOT, dir))).map(
    (file) => ({
      rel: path.relative(ROOT, file).split(path.sep).join("/"),
      source: readFileSync(file, "utf8"),
    }),
  );

  it("are only the listed invariant tests", () => {
    const offenders = files
      .filter(({ rel }) => rel !== "src/lib/data/live-data-tests.test.ts")
      .filter(({ source }) => readsLiveData(source))
      .map(({ rel }) => rel)
      .filter((rel) => !LIVE_INVARIANT_TESTS.has(rel));
    expect(offenders).toEqual([]);
  });

  it("never reaches live data through the shared outlook fixtures", () => {
    for (const name of ["scenario-input", "review-profiles"]) {
      const fixture = readFileSync(
        path.join(ROOT, "src/lib/outlook/__fixtures__", `${name}.ts`),
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

  it("sees the manifest and every core however a test reaches them", () => {
    expect(readsLiveData(`import m from "../../data/manifest.json";`)).toBe(
      true,
    );
    expect(readsLiveData(`readJson("src/data/manifest.json")`)).toBe(true);
    expect(readsLiveData(`popularOccupations(loadAllCores(), m)`)).toBe(true);
    // Mocking the manifest with frozen data is how a test avoids it.
    expect(readsLiveData(`vi.mock("../../data/manifest.json", f)`)).toBe(false);
  });
});
