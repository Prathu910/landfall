import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) {
      // Fixtures are test support and may read the importer's output.
      return name === "__fixtures__" ? [] : sources(file);
    }
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [file] : [];
  });
}

describe("import direction", () => {
  it("no non-test file under src/lib imports from scripts/", () => {
    const offenders = sources("src/lib").filter((file) =>
      /from\s+["'](?:\.\.\/)+scripts\//.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
