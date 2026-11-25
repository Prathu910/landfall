// Usage:
//   npm run page-watch -- --state <file> [--dry-run]
// Reads every cited page (fetch-pages.ts has the politeness rules), compares
// each with the saved state, opens or comments on `source-watch` issues
// (assigned to the founder), keeps the one "Sources the watcher cannot read"
// issue current, and then writes the new state to <file>. A dry run
// (--dry-run or DRY_RUN=1) never calls GitHub: it prints the actions and
// writes the state to a temp file. The summary goes to stdout and, in
// Actions, to $GITHUB_STEP_SUMMARY.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { FOUNDER } from "../automation/failure-issue";
import { realGh, type Gh } from "../automation/gh";
import { writeFileAtomic } from "../import/atomic-write";
import { USER_AGENT } from "../state-lists/shared";
import { readAll } from "./fetch-pages";
import { LABEL, STANDING_TITLE } from "./issue-text";
import { collectSources } from "./sources";
import {
  planWatch,
  type OpenWatchIssue,
  type StandingIssue,
  type WatchAction,
  type WatchState,
} from "./watch";

// Under the step's 20 minutes, so the plan, issues and state always follow.
const RUN_BUDGET_MS = 15 * 60_000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function isEntry(value: unknown): boolean {
  const entry = value as Record<string, unknown> | null;
  return (
    typeof entry?.hash === "string" &&
    typeof entry.text === "string" &&
    typeof entry.firstSeen === "string" &&
    typeof entry.checkedOn === "string" &&
    Number.isInteger(entry.failures)
  );
}

/** The saved state, or null (a fresh baseline) when it is missing or unreadable. */
export function parseState(text: string | null): WatchState | null {
  if (text === null) return null;
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value))
      return null;
    return Object.values(value).every(isEntry) ? (value as WatchState) : null;
  } catch {
    return null;
  }
}

const BOT = ["--author", "app/github-actions"];

function openIssues(gh: Gh): OpenWatchIssue[] {
  return JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "open",
      "--label",
      LABEL,
      ...BOT,
      "--limit",
      "200",
      "--json",
      "number,title,body",
    ]),
  ) as OpenWatchIssue[];
}

/** The standing issue, open or closed (an open one first), found by its exact title. */
export function findStandingIssue(gh: Gh): StandingIssue | null {
  const found = JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "all",
      ...BOT,
      "--search",
      `in:title "${STANDING_TITLE}"`,
      "--limit",
      "20",
      "--json",
      "number,title,body,state",
    ]),
  ) as (StandingIssue & { title: string })[];
  const matches = found.filter((issue) => issue.title === STANDING_TITLE);
  const issue = matches.find((match) => match.state === "OPEN") ?? matches[0];
  return issue
    ? { number: issue.number, body: issue.body, state: issue.state }
    : null;
}

/** Page text only ever reaches `gh` as an argument array and on stdin, never a shell. */
export function applyActions(gh: Gh, actions: WatchAction[]): void {
  for (const action of actions) {
    if (action.kind === "create")
      gh(
        [
          "issue",
          "create",
          "--title",
          action.title,
          "--label",
          action.label,
          "--assignee",
          FOUNDER,
          "--body-file",
          "-",
        ],
        action.body,
      );
    else
      gh(
        ["issue", action.kind, String(action.number), "--body-file", "-"],
        action.body,
      );
  }
}

function sydneyToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
  }).format(new Date());
}

function stateFlag(argv: string[]): string | null {
  const index = argv.indexOf("--state");
  if (index === -1) return null;
  const path = argv[index + 1];
  if (!path || path.startsWith("--"))
    throw new Error("--state needs a file path");
  return path;
}

function printActions(actions: WatchAction[]): void {
  for (const action of actions) {
    const head =
      action.kind === "create"
        ? `create "${action.title}"`
        : `${action.kind} #${action.number}`;
    console.log(`\n--- would ${head} ---\n${action.body}`);
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run") || process.env.DRY_RUN === "1";
  const statePath = stateFlag(argv);
  if (!statePath && !dryRun)
    throw new Error("Usage: page-watch --state <file> [--dry-run]");
  const gh = realGh(dryRun);
  const today = process.env.TODAY ?? sydneyToday();
  const sources = collectSources();
  const state = parseState(
    statePath && existsSync(statePath) ? readFileSync(statePath, "utf8") : null,
  );
  const readToday = new Set(
    Object.entries(state ?? {})
      .filter(([, entry]) => entry.checkedOn === today)
      .map(([url]) => url),
  );
  const { results, notes } = await readAll(
    sources.map((source) => source.url),
    readToday,
    {
      fetch,
      sleep,
      now: Date.now,
      log: console.error,
      userAgent: USER_AGENT,
      deadline: Date.now() + RUN_BUDGET_MS,
    },
  );
  const plan = planWatch({
    sources,
    results,
    state,
    openIssues: openIssues(gh),
    standingIssue: findStandingIssue(gh),
    today,
    notes,
  });
  if (dryRun) printActions(plan.actions);
  applyActions(gh, plan.actions);
  const out =
    dryRun || !statePath
      ? join(tmpdir(), `page-watch-state-${Date.now()}.json`)
      : statePath;
  mkdirSync(dirname(out), { recursive: true });
  writeFileAtomic(out, `${JSON.stringify(plan.state)}\n`);
  console.log(`\n${plan.summary}\n\nState written to ${out}`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${plan.summary}\n`);
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (
  process.argv[1]?.endsWith("cli.ts") &&
  process.argv[1].includes("page-watch")
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
