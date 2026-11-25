import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { BUILDER_SENTINELS } from "../src/lib/report-issue/sentinels";

/**
 * Built pages that only render a report payload, so their JS must not contain
 * the report builder (paid report spec: the full report is built on the server).
 * Plan 3 adds check/index.html and report/index.html.
 */
export const LOCKED_PAGES: string[] = ["sample/index.html"];

const CHUNK_RE = /(?:src|href)="(\/_next\/static\/[^"?]+\.js)(?:\?[^"]*)?"/g;

/** Every `/_next/static/...js` the page loads or preloads, once each, in page order. */
export function chunksForPage(html: string): string[] {
  return [...new Set([...html.matchAll(CHUNK_RE)].map((match) => match[1]))];
}

/** The builder sentinels present in a chunk's code. */
export function findSentinels(js: string): string[] {
  return BUILDER_SENTINELS.filter((sentinel) => js.includes(sentinel));
}

/** One problem per line: a missing file, or a chunk that ships a sentinel. */
function pageProblems(outDir: string, page: string): string[] {
  const file = path.join(outDir, page);
  if (!existsSync(file)) return [`${page} is missing from ${outDir}`];
  return chunksForPage(readFileSync(file, "utf8")).flatMap((chunk) => {
    const chunkFile = path.join(outDir, chunk);
    if (!existsSync(chunkFile)) return [`${page}: ${chunk} is missing`];
    return findSentinels(readFileSync(chunkFile, "utf8")).map(
      (sentinel) =>
        `${page} ships the report builder: ${chunk} contains "${sentinel}"`,
    );
  });
}

function main(): void {
  const outDir = path.resolve("out");
  const problems = LOCKED_PAGES.flatMap((page) => pageProblems(outDir, page));
  if (problems.length > 0) {
    for (const problem of problems) console.error(`bundle lock: ${problem}`);
    process.exitCode = 1;
    return;
  }
  const count = LOCKED_PAGES.length;
  console.log(`bundle lock: ${count} page${count === 1 ? "" : "s"} clean`);
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("check-bundle-lock.ts")) main();
