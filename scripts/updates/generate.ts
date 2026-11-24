/**
 * `npm run updates:generate`: writes one month's recap facts file,
 * src/data/updates/<month>.json, one section at a time. It is the only writer
 * of src/data/updates/. Each run replaces only the section it is asked for.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isManifest } from "../../src/lib/data/guards";
import { shiftMonth } from "../../src/lib/data/months";
import { isRoundsFile } from "../../src/lib/data/rounds-file";
import type {
  Manifest,
  MonthKey,
  OccupationCore,
} from "../../src/lib/data/types";
import { isOccupationCore } from "../../src/lib/data/guards";
import { isFederalList } from "../../src/lib/state-outlook/rules-guards";
import { monthOfDate, sydneyDate } from "../../src/lib/updates/dates";
import { buildDataSection } from "../../src/lib/updates/facts-data";
import {
  buildRoundSection,
  previousRound,
} from "../../src/lib/updates/facts-round";
import { isRecapFacts } from "../../src/lib/updates/guards";
import { UPDATES_DIR, loadRecap } from "../../src/lib/updates/load-server";
import { withDataSection, withRoundSection } from "../../src/lib/updates/merge";
import type { DataSection, RecapFacts } from "../../src/lib/updates/types";
import { writeFileAtomic } from "../import/atomic-write";

export type GenerateArgs = {
  month: MonthKey;
  today: string;
} & (
  | { section: "round"; round: string }
  | { section: "data"; spotlight?: string; previousManifest?: string }
);

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODE = /^\d{6}$/;
const FLAGS = [
  "--month",
  "--section",
  "--round",
  "--spotlight",
  "--previous-manifest",
  "--today",
];

export function parseGenerateArgs(argv: string[]): GenerateArgs {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!FLAGS.includes(flag)) throw new Error(`Unknown flag ${flag}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} needs a value`);
    }
    if (values.has(flag)) throw new Error(`${flag} given twice`);
    values.set(flag, value);
  }
  const month = values.get("--month");
  if (!month || !MONTH.test(month)) {
    throw new Error("--month YYYY-MM is required");
  }
  const today = values.get("--today") ?? sydneyDate(new Date());
  if (!DATE.test(today)) throw new Error("--today must be YYYY-MM-DD");
  const section = values.get("--section");
  if (section === "round") {
    const round = values.get("--round");
    if (!round || !DATE.test(round)) {
      throw new Error("--section round needs --round YYYY-MM-DD");
    }
    for (const flag of ["--spotlight", "--previous-manifest"]) {
      if (values.has(flag)) throw new Error(`${flag} is for --section data`);
    }
    return { month, today, section, round };
  }
  if (section === "data") {
    if (values.has("--round"))
      throw new Error("--round is for --section round");
    const spotlight = values.get("--spotlight");
    if (spotlight !== undefined && !CODE.test(spotlight)) {
      throw new Error("--spotlight must be a six-digit occupation code");
    }
    return {
      month,
      today,
      section,
      spotlight,
      previousManifest: values.get("--previous-manifest"),
    };
  }
  throw new Error("--section must be round or data");
}

const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(file, "utf8"));

function readManifest(file: string): Manifest {
  const value = readJson(file);
  if (!isManifest(value)) throw new Error(`${file} is not a valid manifest`);
  return value;
}

function loadExisting(month: MonthKey): RecapFacts | null {
  return existsSync(path.join(UPDATES_DIR, `${month}.json`))
    ? loadRecap(month)
    : null;
}

function loadRounds() {
  const value = readJson("src/data/rounds.json");
  if (!isRoundsFile(value)) throw new Error("src/data/rounds.json is invalid");
  return value;
}

function buildRound(
  args: Extract<GenerateArgs, { section: "round" }>,
  existing: RecapFacts | null,
): RecapFacts {
  const manifest = readManifest("src/data/manifest.json");
  const rounds = loadRounds();
  const round = rounds.rounds.find((r) => r.date === args.round);
  if (!round) throw new Error(`Round ${args.round} is not in rounds.json`);
  if (monthOfDate(round.date) !== args.month) {
    throw new Error(`Round ${round.date} is not in ${args.month}`);
  }
  const index = readJson("src/data/occupation-index.json") as {
    code: string;
    name: string;
  }[];
  const section = buildRoundSection({
    round,
    previous: previousRound(rounds, round.date),
    names: new Map(index.map((o) => [o.code, o.name])),
    sources: {
      currentRounds: manifest.sources.currentRounds,
      previousRounds: manifest.sources.previousRounds,
      // R22: the round check date, once the manifest carries one.
      checkedAt:
        (manifest as Manifest & { roundsCheckedAt?: string }).roundsCheckedAt ??
        manifest.checkedAt,
    },
    today: args.today,
  });
  return withRoundSection(
    existing,
    args.month,
    round.date,
    section,
    args.today,
  );
}

/** The previous manifest must be last month's; this month's would report no change. */
export function checkPreviousManifest(
  manifest: Manifest,
  month: MonthKey,
): Manifest {
  const previousMonth = shiftMonth(month, -1);
  if (manifest.asAt !== previousMonth) {
    throw new Error(
      `--previous-manifest is for ${manifest.asAt}, not ${previousMonth}`,
    );
  }
  return manifest;
}

/**
 * A rerun (such as a spotlight swap) without --previous-manifest keeps the
 * added/removed lists the first run recorded.
 */
export function keepAddedAndRemoved(
  section: DataSection,
  kept: DataSection | null,
  previousManifest: Manifest | null,
): DataSection {
  if (previousManifest || !kept) return section;
  return {
    ...section,
    occupationsAdded: kept.occupationsAdded,
    occupationsRemoved: kept.occupationsRemoved,
  };
}

/**
 * Every index entry that has a core file counts, including hasData:false
 * occupations that publish "<20" cells (an interval must contain the true
 * value); buildDataSection itself drops the lastAsAt entries (R6).
 */
export function loadAllCores(dataDir = "src/data"): OccupationCore[] {
  const index = readJson(path.join(dataDir, "occupation-index.json")) as {
    code: string;
  }[];
  return index.flatMap(({ code }) => {
    const file = path.join(dataDir, "occupations", `${code}.json`);
    if (!existsSync(file)) return [];
    const core = readJson(file);
    if (!isOccupationCore(core)) throw new Error(`${file} is not a valid core`);
    return [core];
  });
}

function buildData(
  args: Extract<GenerateArgs, { section: "data" }>,
  existing: RecapFacts | null,
): RecapFacts {
  const manifest = readManifest("src/data/manifest.json");
  if (manifest.asAt !== args.month) {
    throw new Error(
      `--section data is for ${manifest.asAt}, the month in src/data/manifest.json`,
    );
  }
  const previousMonth = shiftMonth(args.month, -1);
  const previousManifest = args.previousManifest
    ? checkPreviousManifest(readManifest(args.previousManifest), args.month)
    : null;
  const previousFacts = loadExisting(previousMonth);
  const cores = loadAllCores();
  const federal = readJson("src/data/state-rules/federal-occupations.json");
  if (!isFederalList(federal)) throw new Error("Federal list is invalid");
  const section = buildDataSection({
    month: args.month,
    cores,
    manifest,
    previousManifest,
    previousFacts,
    rounds: loadRounds(),
    federal,
    today: args.today,
    spotlight: args.spotlight ?? null,
  });
  return withDataSection(
    existing,
    args.month,
    keepAddedAndRemoved(section, existing?.data ?? null, previousManifest),
    args.today,
  );
}

function main(): void {
  try {
    const args = parseGenerateArgs(process.argv.slice(2));
    const existing = loadExisting(args.month);
    const facts =
      args.section === "round"
        ? buildRound(args, existing)
        : buildData(args, existing);
    if (!isRecapFacts(facts)) throw new Error("Merged facts file is invalid");
    mkdirSync(UPDATES_DIR, { recursive: true });
    const file = path.join(UPDATES_DIR, `${args.month}.json`);
    writeFileAtomic(file, `${JSON.stringify(facts)}\n`);
    console.log(`Wrote ${file} (${args.section} section)`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

// tsx runs this file as CommonJS; tests import parseGenerateArgs without running.
if (process.argv[1]?.endsWith("generate.ts")) main();
