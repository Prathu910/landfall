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

function parseFacts(text: string, where: string): RecapFacts {
  const value: unknown = JSON.parse(text);
  if (!isRecapFacts(value)) throw new Error(`${where} is not recap facts`);
  return value;
}

/** The file's copy on `base`, or null when the base doesn't have it. */
function readBase(base: string, path: string): RecapFacts | null {
  let text: string;
  try {
    text = execFileSync("git", ["show", `${base}:${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
  return parseFacts(text, `${base}:${path}`);
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
  const problems: string[] = [];
  for (const name of readdirSync(DIR).filter((n) => n.endsWith(".json"))) {
    const path = join(DIR, name);
    const month = name.replace(/\.json$/, "");
    const head = parseFacts(readFileSync(path, "utf8"), path);
    for (const section of changedFrozenSections(readBase(base, path), head))
      if (!allowed.has(`${month}:${section}`))
        problems.push(`${month}:${section}`);
  }
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
if (process.argv[1]?.endsWith("frozen-check.ts")) main();
