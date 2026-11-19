import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Only upright faces are loaded (src/app/layout.tsx), so any italic would be
// synthesized by the browser. The vendored Stageshow kit is excluded (B1).
const ROOT = process.cwd();
const EXCLUDED = "src/components/stageshow-kit/";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function sources(pattern: RegExp): { file: string; text: string }[] {
  return walk(join(ROOT, "src"))
    .map((path) => relative(ROOT, path))
    .filter((file) => pattern.test(file) && !file.startsWith(EXCLUDED))
    .filter((file) => !file.endsWith(".test.ts"))
    .map((file) => ({ file, text: readFileSync(join(ROOT, file), "utf8") }));
}

describe("no synthesized italics", () => {
  it("loads no italic face", () => {
    const layout = readFileSync(join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/fontsource\/[^"]*italic/);
  });

  it("never asks for italic or oblique type", () => {
    const hits = sources(/\.(css|tsx?)$/).filter(({ text }) =>
      /font-?style\s*:\s*["']?(italic|oblique)/i.test(text),
    );
    expect(hits.map((h) => h.file)).toEqual([]);
  });

  it("sets the browser's italic elements upright", () => {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");
    const rule =
      /(^|\n)em,\s*i,\s*cite,\s*dfn,\s*var,\s*address\s*\{([^}]*)\}/.exec(css);
    expect(rule?.[2]).toMatch(/font-style:\s*normal/);
  });

  it("splits no heading with an <em>", () => {
    const hits = sources(/\.tsx$/).flatMap(({ file, text }) =>
      [...text.matchAll(/<h[1-6][\s>][\s\S]*?<\/h[1-6]>/g)]
        .filter((m) => m[0].includes("<em"))
        .map(() => file),
    );
    expect(hits).toEqual([]);
  });
});
