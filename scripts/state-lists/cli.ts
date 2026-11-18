// Usage: npm run data:state-lists -- [--only federal] [--checked-at YYYY-MM-DD]
import { mkdirSync } from "node:fs";
import index from "../../src/data/occupation-index.json";
import {
  FEDERAL_LIST_URL,
  assertPlausible,
  buildFederalList,
  countEligible,
  fetchFederalPage,
  writeFederalList,
} from "./federal";

const IMPORTERS = ["federal"] as const;
type ImporterName = (typeof IMPORTERS)[number];

export type CliArgs = { only: ImporterName | null; checkedAt: string };

const OUT_DIR = "src/data/state-rules";
// The 2026-11-18 list had 427 codes for 190 and 504 for 491.
const MIN_ELIGIBLE_PER_VISA = 300;

function isImporterName(name: string): name is ImporterName {
  return (IMPORTERS as readonly string[]).includes(name);
}

function isCalendarDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
}

function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function parseArgs(argv: string[], today: string): CliArgs {
  let only: ImporterName | null = null;
  let checkedAt = today;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--only") {
      const name = argv[++i] ?? "";
      if (!isImporterName(name)) {
        throw new Error(`Unknown importer "${name}" (have: ${IMPORTERS})`);
      }
      only = name;
    } else if (flag === "--checked-at") {
      checkedAt = argv[++i] ?? "";
    } else {
      throw new Error(`Unknown argument "${flag}"`);
    }
  }
  if (!isCalendarDate(checkedAt)) {
    throw new Error(`--checked-at must be YYYY-MM-DD, got "${checkedAt}"`);
  }
  return { only, checkedAt };
}

async function importFederal(checkedAt: string): Promise<void> {
  const html = await fetchFederalPage();
  const { list, unmatched } = buildFederalList(html, index, {
    source: FEDERAL_LIST_URL,
    checkedAt,
  });
  assertPlausible(list, MIN_ELIGIBLE_PER_VISA);
  const counts = countEligible(Object.values(list.entries));
  const onDashboard = countEligible(
    index.flatMap((o) => list.entries[o.code] ?? []),
  );
  console.log(`Federal entries: ${Object.keys(list.entries).length}`);
  console.log(`Eligible for 190: ${counts["190"]}, 491: ${counts["491"]}`);
  console.log(
    `Of the ${index.length} dashboard occupations, eligible for 190: ${onDashboard["190"]}, 491: ${onDashboard["491"]}`,
  );
  console.log(`Left out (no exact 2013 code): ${unmatched.length}`);
  for (const row of unmatched) {
    console.log(`  ${row.occupation} (2022: ${row.codes2022.join(", ")})`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const path = `${OUT_DIR}/federal-occupations.json`;
  writeFederalList(path, list);
  console.log(`Wrote ${path}`);
}

async function main(): Promise<void> {
  try {
    const args = parseArgs(process.argv.slice(2), localToday());
    if (args.only === null || args.only === "federal") {
      await importFederal(args.checkedAt);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

// tsx runs this file as CommonJS, so there is no top-level await; tests import
// parseArgs without starting an import.
if (process.argv[1]?.endsWith("cli.ts")) void main();
