import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { BUILDER_SENTINELS } from "../src/lib/report-issue/sentinels";

/**
 * Built pages that only render a report payload, so their JS must not contain
 * the report builder (paid report spec: the full report is built on the server).
 * Every chunk in the build is scanned too (plan 3 ruling R5), so a chunk a
 * page loads later, outside its HTML, can't carry the builder either.
 */
export const LOCKED_PAGES: string[] = [
  "sample/index.html",
  "check/index.html",
  "report/index.html",
];

const CHUNK_RE = /(?:src|href)="(\/_next\/static\/[^"?]+\.js)(?:\?[^"]*)?"/g;

/** Every `/_next/static/...js` the page loads or preloads, once each, in page order. */
export function chunksForPage(html: string): string[] {
  return [...new Set([...html.matchAll(CHUNK_RE)].map((match) => match[1]))];
}

/** "sample/index.html" is the route "sample"; "index.html" is the root. */
function routeOf(page: string): string {
  return page.replace(/(^|\/)index\.html$/, "");
}

/**
 * A page whose chunk list the lock can't trust: none found (changed script
 * markup or an asset prefix would otherwise pass silently), or none of them
 * is the route's own page chunk, which holds the page's client code.
 */
export function chunkListProblems(page: string, chunks: string[]): string[] {
  if (chunks.length === 0) {
    return [
      `${page} loads no /_next/static chunks, so the lock cannot check it`,
    ];
  }
  const route = routeOf(page);
  const own = `/_next/static/chunks/app/${route ? `${route}/` : ""}page-`;
  const ownChunk = chunks.some(
    (chunk) => chunk.startsWith(own) && !chunk.slice(own.length).includes("/"),
  );
  if (ownChunk) return [];
  const name = `app/${route ? `${route}/` : ""}page-*.js`;
  return [
    `${page} loads no ${name} chunk, so the lock may be missing its code`,
  ];
}

/** The builder sentinels present in a chunk's code. */
export function findSentinels(js: string): string[] {
  return BUILDER_SENTINELS.filter((sentinel) => js.includes(sentinel));
}

/** One problem per line: a missing file, an untrusted chunk list, or a chunk that ships a sentinel. */
function pageProblems(outDir: string, page: string): string[] {
  const file = path.join(outDir, page);
  if (!existsSync(file)) return [`${page} is missing from ${outDir}`];
  const chunks = chunksForPage(readFileSync(file, "utf8"));
  const listProblems = chunkListProblems(page, chunks);
  if (listProblems.length > 0) return listProblems;
  return chunks.flatMap((chunk) => {
    const chunkFile = path.join(outDir, chunk);
    if (!existsSync(chunkFile)) return [`${page}: ${chunk} is missing`];
    return findSentinels(readFileSync(chunkFile, "utf8")).map(
      (sentinel) =>
        `${page} ships the report builder: ${chunk} contains "${sentinel}"`,
    );
  });
}

/** Every chunk, by its `/_next/static/...` path, that ships a sentinel. */
export function staticChunkProblems(files: Record<string, string>): string[] {
  return Object.entries(files).flatMap(([chunk, js]) =>
    findSentinels(js).map((sentinel) => `${chunk} contains "${sentinel}"`),
  );
}

/** Every .js file under out/_next/static, keyed by its served path. */
function staticChunks(outDir: string): Record<string, string> {
  const root = path.join(outDir, "_next", "static");
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const file = path.join(dir, name);
      return statSync(file).isDirectory() ? walk(file) : [file];
    });
  if (!existsSync(root)) return {};
  return Object.fromEntries(
    walk(root)
      .filter((file) => file.endsWith(".js"))
      .map((file) => [
        `/${path.relative(outDir, file).split(path.sep).join("/")}`,
        readFileSync(file, "utf8"),
      ]),
  );
}

function main(): void {
  const outDir = path.resolve("out");
  const chunks = staticChunks(outDir);
  const problems = [
    ...LOCKED_PAGES.flatMap((page) => pageProblems(outDir, page)),
    ...staticChunkProblems(chunks).map(
      (problem) => `the build ships the report builder: ${problem}`,
    ),
  ];
  if (problems.length > 0) {
    for (const problem of problems) console.error(`bundle lock: ${problem}`);
    process.exitCode = 1;
    return;
  }
  const count = LOCKED_PAGES.length;
  const scanned = Object.keys(chunks).length;
  console.log(
    `bundle lock: ${count} page${count === 1 ? "" : "s"} clean, ${scanned} chunks scanned`,
  );
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("check-bundle-lock.ts")) main();
