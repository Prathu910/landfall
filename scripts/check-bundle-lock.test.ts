import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BUILDER_SENTINELS } from "../src/lib/report-issue/sentinels";
import {
  chunkListProblems,
  chunksForPage,
  findSentinels,
} from "./check-bundle-lock";

const PAGE = `<!DOCTYPE html><html><head>
<link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-838d.js"/>
<link rel="stylesheet" href="/_next/static/css/app.css"/>
<script src="/_next/static/chunks/main-app-8973.js" async=""></script>
<script src="/_next/static/chunks/app/sample/page-296b.js?dpl=abc" async=""></script>
<script src="/_next/static/chunks/webpack-838d.js" async=""></script>
<script src="https://example.test/other.js"></script>
</head></html>`;

/** Every .ts and .tsx file under `dir`, recursively. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return sourceFiles(file);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [file] : [];
  });
}

describe("check-bundle-lock", () => {
  it("lists the page's script chunks", () => {
    expect(chunksForPage(PAGE)).toEqual([
      "/_next/static/chunks/webpack-838d.js",
      "/_next/static/chunks/main-app-8973.js",
      "/_next/static/chunks/app/sample/page-296b.js",
    ]);
  });

  it("accepts a page that loads its own route chunk", () => {
    expect(chunkListProblems("sample/index.html", chunksForPage(PAGE))).toEqual(
      [],
    );
  });

  // Changed script markup or an asset prefix must not switch the lock off.
  it("fails a page that loads no chunks", () => {
    expect(chunkListProblems("sample/index.html", [])).toEqual([
      "sample/index.html loads no /_next/static chunks, so the lock cannot check it",
    ]);
  });

  it("fails a page without its own route chunk", () => {
    const chunks = [
      "/_next/static/chunks/main-app-8973.js",
      "/_next/static/chunks/app/check/page-e486.js",
      "/_next/static/chunks/app/sample/extra/page-1a2b.js",
    ];
    expect(chunkListProblems("sample/index.html", chunks)).toEqual([
      "sample/index.html loads no app/sample/page-*.js chunk, so the lock may be missing its code",
    ]);
  });

  it("finds a sentinel in minified code", () => {
    const sentinel = BUILDER_SENTINELS[0];
    const js = `(()=>{let e=${JSON.stringify(sentinel)};return{t:e}})();`;
    expect(findSentinels(js)).toEqual([sentinel]);
  });

  it("passes clean code", () => {
    expect(findSentinels("(()=>{let e='a renderer';return e})();")).toEqual([]);
  });

  // A sentinel that a renderer ships would fail every build (ruling R5).
  it("uses sentinels that no component or page contains", () => {
    const files = [...sourceFiles("src/components"), ...sourceFiles("src/app")];
    const hits = files.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return BUILDER_SENTINELS.filter((s) => text.includes(s)).map(
        (s) => `${file}: ${s}`,
      );
    });
    expect(BUILDER_SENTINELS).toHaveLength(3);
    expect(hits).toEqual([]);
  });
});
