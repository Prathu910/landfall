import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const MIN_PX = 12;
const MIN_REM = 0.75;
/** Vendored kit: excluded from the floor (ruling B1). */
const EXCLUDED = "src/components/stageshow-kit/";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(SRC)
  .map((path) => relative(ROOT, path))
  .filter((path) => !path.startsWith(EXCLUDED));

function tooSmall(value: string): boolean {
  const lengths = [...value.matchAll(/(\d*\.?\d+)(px|rem|em)\b/g)];
  return lengths.some(([, n, unit]) =>
    unit === "px" ? Number(n) < MIN_PX : Number(n) < MIN_REM,
  );
}

function findViolations(): string[] {
  const out: string[] = [];
  for (const file of files) {
    const lines = readFileSync(join(ROOT, file), "utf8").split("\n");
    const isCss = file.endsWith(".css");
    const isTsx = file.endsWith(".tsx");
    if (!isCss && !isTsx) continue;
    lines.forEach((line, i) => {
      if (isCss) {
        const m = line.match(/(?:^|[;{\s])font-size\s*:\s*([^;}]+)/);
        if (m && tooSmall(m[1])) out.push(`${file}:${i + 1} ${m[1].trim()}`);
      } else {
        const m = line.match(/fontSize\s*[=:]\s*\{?\s*["']?(\d*\.?\d+)(px)?/);
        if (m && Number(m[1]) < MIN_PX) out.push(`${file}:${i + 1} ${m[1]}`);
      }
    });
  }
  return out;
}

describe("type size floor", () => {
  it("has no font-size under 12px (0.75rem) in CSS or inline TSX", () => {
    expect(findViolations()).toEqual([]);
  });
});
