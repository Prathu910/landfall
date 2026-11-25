/**
 * `npm run updates:retention [-- --month YYYY-MM]`: deletes the PNGs and
 * manifests of `public/social/` months older than the latest three (spec 6.7;
 * R11). It is the only command that deletes social images. Every `og.png`
 * stays, including `round-*` ones, because a recap's OG image may fall back
 * to its round set's.
 */
import { existsSync, readdirSync, rmSync, rmdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import type { MonthKey } from "../../src/lib/data/types";

export const RETENTION_MONTHS = 3;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const SOCIAL = "public/social";

/**
 * The files to delete: every file of a month that is not among the newest
 * `RETENTION_MONTHS` months (up to `latestMonth`), except `og.png` files.
 * `socialDirs` are the month folder names; `files` are repo-relative paths.
 */
export function retentionPlan(
  socialDirs: string[],
  files: string[],
  latestMonth: MonthKey,
): string[] {
  const kept = socialDirs
    .filter((month) => month <= latestMonth)
    .sort()
    .slice(-RETENTION_MONTHS);
  const oldest = kept[0];
  if (oldest === undefined) return [];
  return files
    .filter((file) => {
      const month = file.split("/")[2];
      return (
        MONTH.test(month ?? "") && month < oldest && basename(file) !== "og.png"
      );
    })
    .sort();
}

function listFiles(dir: string, root: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? listFiles(path, root)
      : [relative(root, path).split("\\").join("/")];
  });
}

function removeEmptyDirs(dir: string): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) removeEmptyDirs(path);
  }
  if (readdirSync(dir).length === 0) rmdirSync(dir);
}

function main(): void {
  try {
    const root = resolve(__dirname, "..", "..");
    const social = join(root, SOCIAL);
    if (!existsSync(social)) return console.log("Nothing to prune.");
    const argv = process.argv.slice(2);
    if (argv.length > 0 && (argv[0] !== "--month" || argv.length !== 2)) {
      throw new Error("Usage: updates:retention [-- --month YYYY-MM]");
    }
    const months = readdirSync(social).filter((name) => MONTH.test(name));
    const latest = argv[1] ?? [...months].sort().at(-1);
    if (!latest || !MONTH.test(latest)) throw new Error("--month YYYY-MM");
    const doomed = retentionPlan(months, listFiles(social, root), latest);
    for (const file of doomed) {
      rmSync(join(root, file));
      console.log(`Deleted ${file}`);
    }
    for (const month of months) {
      const dir = join(social, month);
      if (existsSync(dir)) removeEmptyDirs(dir);
    }
    console.log(`Pruned ${doomed.length} files.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (process.argv[1]?.endsWith(join("updates", "retention.ts"))) main();
