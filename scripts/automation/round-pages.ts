// Usage: tsx scripts/automation/round-pages.ts --dir <dir> --page previous
// The round job's copies of the official 189 round pages, kept in one folder
// for the run, so each page is requested at most once (founder decision 25
// Nov 2026, docs/STRATEGY.md): a page already in the folder is read from it.
// The site's robots.txt is read once per run and saved beside the pages
// (robots.json); a page it disallows is not requested, and a robots.txt that
// refuses or can't be read stops the run. Every request to the site waits
// until ROUND_PAGE_GAP_MS after the last one (last-request holds its time).
// detect-round.ts saves the current page; this CLI saves the previous one.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { writeFileAtomic } from "../import/atomic-write";
import {
  CURRENT_ROUNDS_URL,
  PREVIOUS_ROUNDS_URL,
  ROUND_PAGE_GAP_MS,
  fetchRoundPage,
} from "../import/rounds";
import { readRobots, type ReadDeps } from "../page-watch/fetch-pages";
import { isAllowed, type RobotsRule } from "../page-watch/robots";
import { USER_AGENT } from "../state-lists/shared";

/** The file names the import's `--rounds-html` folder uses. */
export const ROUND_PAGE_FILES = {
  current: "invitation-rounds.html",
  previous: "previous-rounds.html",
} as const;
export type RoundPage = keyof typeof ROUND_PAGE_FILES;

const URLS: Record<RoundPage, string> = {
  current: CURRENT_ROUNDS_URL,
  previous: PREVIOUS_ROUNDS_URL,
};

/** Waits until the gap since the folder's last request has passed, then records this one. */
async function politeTurn(dir: string, deps: ReadDeps): Promise<void> {
  const file = join(dir, "last-request");
  const last = existsSync(file) ? Number(readFileSync(file, "utf8")) : NaN;
  if (Number.isFinite(last)) {
    const due = last + ROUND_PAGE_GAP_MS;
    if (due > deps.now()) await deps.sleep(due - deps.now());
  }
  writeFileAtomic(file, `${deps.now()}\n`);
}

/** The site's robots.txt rules, read once per run (the folder's robots.json). */
async function robotsRules(
  dir: string,
  host: string,
  deps: ReadDeps,
): Promise<RobotsRule[]> {
  const file = join(dir, "robots.json");
  if (existsSync(file)) {
    const saved = JSON.parse(readFileSync(file, "utf8")) as {
      host: string;
      rules: RobotsRule[];
    };
    if (saved.host === host) return saved.rules;
  }
  await politeTurn(dir, deps);
  const read = await readRobots(host, deps);
  if (read.stop) throw new Error(read.note ?? `${host}: robots.txt stopped`);
  writeFileAtomic(file, `${JSON.stringify({ host, rules: read.rules })}\n`);
  return read.rules;
}

/** One round page: from the folder when saved, else requested once and saved. */
export async function savedRoundPage(
  dir: string,
  page: RoundPage,
  deps: ReadDeps,
): Promise<string> {
  const file = join(dir, ROUND_PAGE_FILES[page]);
  if (existsSync(file)) return readFileSync(file, "utf8");
  mkdirSync(dir, { recursive: true });
  const url = URLS[page];
  const rules = await robotsRules(dir, new URL(url).host, deps);
  if (!isAllowed(rules, url))
    throw new Error(`robots.txt disallows ${url}; it was not requested`);
  await politeTurn(dir, deps);
  deps.log(`Requesting ${url}`);
  const html = await fetchRoundPage(url, deps.fetch);
  writeFileAtomic(file, html);
  return html;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The real network and clock, with the browser User-Agent. */
export function liveDeps(): ReadDeps {
  return {
    fetch,
    sleep,
    now: Date.now,
    log: (line) => console.error(line),
    userAgent: USER_AGENT,
    deadline: Infinity,
  };
}

function flagValue(argv: string[], name: string): string {
  const index = argv.indexOf(name);
  const value = index === -1 ? undefined : argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dir = flagValue(argv, "--dir");
  const page = flagValue(argv, "--page");
  if (page !== "current" && page !== "previous")
    throw new Error("--page must be current or previous");
  const saved = existsSync(join(dir, ROUND_PAGE_FILES[page]));
  await savedRoundPage(dir, page, liveDeps());
  console.log(
    `${ROUND_PAGE_FILES[page]} ${saved ? "was saved already" : "saved"} in ${dir}`,
  );
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("round-pages.ts")) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
