import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { findSmallFontSizes } from "./font-floor";

const ROOT = process.cwd();
const SCANNED = /\.(css|tsx?)$/;
const SELF = /src\/app\/(css-floor|font-floor)(\.test)?\.ts$/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function findViolations(): string[] {
  return walk(join(ROOT, "src"))
    .map((path) => relative(ROOT, path))
    .filter((file) => SCANNED.test(file) && !SELF.test(file))
    .flatMap((file) => {
      const kind = file.endsWith(".css") ? "css" : "tsx";
      const source = readFileSync(join(ROOT, file), "utf8");
      return findSmallFontSizes(source, kind).map(
        (hit) => `${file}:${hit.line} ${hit.value}`,
      );
    });
}

describe("type size floor", () => {
  it("has no font size under 12px (0.75rem) in src CSS, TS or TSX", () => {
    expect(findViolations()).toEqual([]);
  });
});
