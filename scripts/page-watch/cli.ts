// Usage:
//   npm run page-watch -- --state <file> [--dry-run]
// Reads every cited page in turn, compares each with the saved state, opens
// or comments on `source-watch` issues (assigned to the founder) and then
// writes the new state to <file>. A dry run (--dry-run or DRY_RUN=1) never
// calls GitHub: it prints the actions and writes the state to a temp file.
// The summary goes to stdout and, in Actions, to $GITHUB_STEP_SUMMARY.
//
// Fetching is polite and never works around a block: one request at a time,
// at least GAP_MS apart (HOST_GAP_MS for the same host, with the hosts taken
// in turn: Queensland answered HTTP 429 to requests 1 s apart), the
// state-list importer's User-Agent (R19) and one retry only for a timeout, a
// network error or a server error (5xx).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { FOUNDER } from "../automation/failure-issue";
import { realGh, type Gh } from "../automation/gh";
import { writeFileAtomic } from "../import/atomic-write";
import { USER_AGENT } from "../state-lists/shared";
import { isLoginPage, normaliseResponse } from "./normalise";
import { collectSources } from "./sources";
import {
  hostOf,
  LABEL,
  planWatch,
  type OpenWatchIssue,
  type WatchAction,
  type WatchResult,
  type WatchState,
} from "./watch";

const GAP_MS = 1_000;
const HOST_GAP_MS = 10_000;
const RETRY_AFTER_MS = 5_000;
const TIMEOUT_MS = 30_000;
const ACCEPT =
  "text/html,application/xhtml+xml,text/csv,application/pdf;q=0.9,*/*;q=0.8";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Attempt = { result: WatchResult; retry: boolean };

function failure(reason: string, retry: boolean): Attempt {
  return { result: { ok: false, reason }, retry };
}

async function attempt(url: string): Promise<Attempt> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: ACCEPT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status >= 400)
      return failure(`HTTP ${response.status}`, response.status >= 500);
    const body = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get("content-type") ?? "";
    if (/html/i.test(type) && isLoginPage(body.toString("utf8")))
      return failure("a sign-in page", false);
    return {
      result: { ok: true, page: normaliseResponse(body, type, url) },
      retry: false,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError")
      return failure(`no answer within ${TIMEOUT_MS / 1000} s`, true);
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    return failure(`network error${cause ? ` (${cause})` : ""}`, true);
  }
}

async function readPage(url: string): Promise<WatchResult> {
  const first = await attempt(url);
  if (!first.retry) return first.result;
  await sleep(RETRY_AFTER_MS);
  return (await attempt(url)).result;
}

/** The URLs with their hosts taken in turn, so one site is never read twice in a row when another is waiting. */
export function politeOrder(urls: string[]): string[] {
  const byHost = new Map<string, string[]>();
  for (const url of urls)
    byHost.set(hostOf(url), [...(byHost.get(hostOf(url)) ?? []), url]);
  const queues = [...byHost.values()];
  const ordered: string[] = [];
  for (let round = 0; ordered.length < urls.length; round++)
    for (const queue of queues)
      if (round < queue.length) ordered.push(queue[round]);
  return ordered;
}

async function readAll(urls: string[]): Promise<Record<string, WatchResult>> {
  const results: Record<string, WatchResult> = {};
  const lastRead = new Map<string, number>();
  let previous = 0;
  for (const url of politeOrder(urls)) {
    const host = hostOf(url);
    const due = Math.max(
      previous + GAP_MS,
      (lastRead.get(host) ?? 0) + HOST_GAP_MS,
    );
    await sleep(Math.max(0, due - Date.now()));
    const result = await readPage(url);
    previous = Date.now();
    lastRead.set(host, previous);
    results[url] = result;
    console.error(
      `${result.ok ? "read" : `failed (${result.reason})`}: ${url}`,
    );
  }
  return results;
}

function isEntry(value: unknown): boolean {
  const entry = value as Record<string, unknown> | null;
  return (
    typeof entry?.hash === "string" &&
    typeof entry.text === "string" &&
    typeof entry.firstSeen === "string" &&
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

function openIssues(gh: Gh): OpenWatchIssue[] {
  return JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "open",
      "--label",
      LABEL,
      "--author",
      "app/github-actions",
      "--limit",
      "200",
      "--json",
      "number,title,body",
    ]),
  ) as OpenWatchIssue[];
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
        ["issue", "comment", String(action.number), "--body-file", "-"],
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
        : `comment on #${action.number}`;
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
  const sources = collectSources();
  const state = parseState(
    statePath && existsSync(statePath) ? readFileSync(statePath, "utf8") : null,
  );
  const results = await readAll(sources.map((source) => source.url));
  const plan = planWatch({
    sources,
    results,
    state,
    openIssues: openIssues(gh),
    today: process.env.TODAY ?? sydneyToday(),
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
