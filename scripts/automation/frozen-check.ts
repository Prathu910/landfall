// Usage: tsx scripts/automation/frozen-check.ts [--base origin/main]
//          [--allow <month>:<section>]...
// Fails (exit 1) when any src/data/updates/*.json changes a section that its
// copy on the base ref already has. `--allow 2026-10:data` exempts one
// section (a founder-requested regeneration). BASE_REF sets the default base.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isRecapFacts } from "../../src/lib/updates/guards";
import { changedFrozenSections } from "../../src/lib/updates/frozen";
import type { RecapFacts } from "../../src/lib/updates/types";

const DIR = "src/data/updates";

function git(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function parseFacts(text: string, where: string): RecapFacts {
  const value: unknown = JSON.parse(text);
  if (!isRecapFacts(value)) throw new Error(`${where} is not recap facts`);
  return value;
}

/** Throws unless `base` names a commit, so an unfetched ref never passes silently. */
export function verifyBase(base: string): void {
  try {
    git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
  } catch {
    throw new Error(`Base ref ${base} is not a commit (run git fetch first)`);
  }
}

/** The facts file names (e.g. 2026-10.json) that `base` has. */
export function listBaseFiles(base: string): string[] {
  return git(["ls-tree", "--name-only", base, `${DIR}/`])
    .split("\n")
    .filter((line) => line.endsWith(".json"))
    .map((line) => line.slice(DIR.length + 1));
}

/** The file's copy on `base`; null only when the base doesn't have it. */
export function readBaseFile(base: string, path: string): RecapFacts | null {
  try {
    git(["cat-file", "-e", `${base}:${path}`]);
  } catch {
    return null;
  }
  return parseFacts(git(["show", `${base}:${path}`]), `${base}:${path}`);
}

/**
 * Frozen sections the head files change, as `<month>:<section>` (a facts
 * file that base has but head lacks is `<month>:file`). `allowed` entries
 * are exempt.
 */
export function checkFrozen(
  head: Map<string, RecapFacts>,
  baseNames: string[],
  readBase: (name: string) => RecapFacts | null,
  allowed: Set<string> = new Set(),
): string[] {
  const problems: string[] = [];
  const month = (name: string) => name.replace(/\.json$/, "");
  for (const [name, facts] of head)
    for (const section of changedFrozenSections(readBase(name), facts))
      problems.push(`${month(name)}:${section}`);
  for (const name of baseNames)
    if (!head.has(name)) problems.push(`${month(name)}:file`);
  return problems.filter((problem) => !allowed.has(problem));
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function main(): void {
  const base = option("--base") ?? process.env.BASE_REF ?? "origin/main";
  const allowed = new Set(
    process.argv.flatMap((arg, i) =>
      arg === "--allow" && process.argv[i + 1] ? [process.argv[i + 1]] : [],
    ),
  );
  verifyBase(base);
  const head = new Map(
    readdirSync(DIR)
      .filter((n) => n.endsWith(".json"))
      .map((n) => [
        n,
        parseFacts(readFileSync(join(DIR, n), "utf8"), join(DIR, n)),
      ]),
  );
  const problems = checkFrozen(
    head,
    listBaseFiles(base),
    (name) => readBaseFile(base, `${DIR}/${name}`),
    allowed,
  );
  if (problems.length > 0) {
    console.error(
      `Frozen sections changed against ${base}: ${problems.join(", ")}`,
    );
    process.exitCode = 1;
  } else {
    console.log(`No frozen sections changed against ${base}.`);
  }
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("frozen-check.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
