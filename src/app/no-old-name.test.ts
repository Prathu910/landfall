import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (/\.json$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name))
      return [];
    return [full];
  });
}

// The preview host is not ours to rename until launch (see metadataBase).
// The only other place the old name may live: the legacy storage key, so old
// saves can be moved or cleared.
const LEGACY_MODULE = path.join("lib", "profile-storage.ts");
const PREVIEW_HOST = "landfall-migration-report.cappedpike4.chatgpt.site";

describe("product name", () => {
  it("never uses the old working name in src", () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => path.relative(SRC, file) !== LEGACY_MODULE)
      .filter((file) =>
        /landfall/i.test(readFileSync(file, "utf8").replace(PREVIEW_HOST, "")),
      );
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});

describe("brand possessive", () => {
  // Plain wording reads better in copy ("our question"), and comments follow.
  it("never writes MigrateLens's in src", () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      /MigrateLens['’]s/.test(readFileSync(file, "utf8")),
    );
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
