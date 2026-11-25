// Usage:
//   tsx scripts/automation/failure-issue.ts report (--month YYYY-MM | --round YYYY-MM-DD | --round-check) --log <file>
//   tsx scripts/automation/failure-issue.ts resolve (--month YYYY-MM | --round YYYY-MM-DD | --round-check)
// `report` opens a failure issue (assigned to the founder) or comments on the
// open one with the same title; `resolve` closes it with a comment linking
// the successful run. The repo is public: bodies hold no secrets, only the
// step name, the last log lines and the run URL.
import { readFileSync } from "node:fs";
import { realGh, type Gh } from "./gh";

export const FOUNDER = "Prathu910";
const LOG_LINES = 50;

export type OpenIssue = { number: number; title: string };
export type FailureAction =
  { kind: "create" } | { kind: "comment"; number: number };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** `Monthly SkillSelect update failed (Nov 2026)` for a `YYYY-MM` month. */
export function monthlyFailureTitle(month: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error(`Not a YYYY-MM month: ${month}`);
  const [year, m] = month.split("-");
  return `Monthly SkillSelect update failed (${MONTHS[Number(m) - 1]} ${year})`;
}

/** `189 round import failed (10 Nov 2026)` for a `YYYY-MM-DD` round date. */
export function roundFailureTitle(date: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date))
    throw new Error(`Not a YYYY-MM-DD date: ${date}`);
  const [year, m, d] = date.split("-");
  return `189 round import failed (${Number(d)} ${MONTHS[Number(m) - 1]} ${year})`;
}

/**
 * The round job's failures before it has read the round page (npm ci,
 * Chrome, the fetch) have no round date, so they share this one issue.
 */
export const ROUND_CHECK_TITLE = "189 round check failed";

export function failureIssueAction(
  open: OpenIssue[],
  title: string,
): FailureAction {
  const existing = open.find((issue) => issue.title === title);
  return existing
    ? { kind: "comment", number: existing.number }
    : { kind: "create" };
}

export const MAX_BODY = 60_000;

/** A fence longer than any backtick run in `text`, so the log can't close it. */
export function fenceFor(text: string): string {
  const longest = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map((run) => run.length),
  );
  return "`".repeat(Math.max(3, longest + 1));
}

export function failureBody(step: string, log: string, runUrl: string): string {
  const tail = log.trim().split("\n").slice(-LOG_LINES).join("\n");
  const fence = fenceFor(tail);
  const body = [
    `Failing step: ${step || "unknown"}`,
    `Run: ${runUrl}`,
    "",
    `Last ${LOG_LINES} log lines:`,
    "",
    fence,
    tail,
    fence,
  ].join("\n");
  return body.length <= MAX_BODY
    ? body
    : `${body.slice(0, MAX_BODY - 100)}\n${fence}\n(truncated)`;
}

function openIssues(gh: Gh): OpenIssue[] {
  return JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "open",
      "--author",
      "app/github-actions",
      "--limit",
      "200",
      "--json",
      "number,title",
    ]),
  ) as OpenIssue[];
}

export function reportFailure(
  gh: Gh,
  title: string,
  body: string,
): FailureAction {
  const action = failureIssueAction(openIssues(gh), title);
  if (action.kind === "create")
    gh(
      [
        "issue",
        "create",
        "--title",
        title,
        "--body-file",
        "-",
        "--assignee",
        FOUNDER,
      ],
      body,
    );
  else
    gh(["issue", "comment", String(action.number), "--body-file", "-"], body);
  return action;
}

/** Closes the open issue with this title, if any; true when one was closed. */
export function resolveFailure(gh: Gh, title: string, runUrl: string): boolean {
  const action = failureIssueAction(openIssues(gh), title);
  if (action.kind === "create") return false;
  gh(
    ["issue", "comment", String(action.number), "--body-file", "-"],
    `Resolved: a later run succeeded. ${runUrl}`,
  );
  gh(["issue", "close", String(action.number)]);
  return true;
}

function flagIn(argv: string[], name: string): string {
  const index = argv.indexOf(name);
  const value = index === -1 ? undefined : argv[index + 1];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const flag = (name: string): string => flagIn(process.argv, name);

const KEYS = ["--month", "--round", "--round-check"];

/** The one place a CLI turns `--month`, `--round` or `--round-check` into a title. */
export function titleFromArgs(argv: string[]): string {
  const keys = KEYS.filter((key) => argv.includes(key));
  if (keys.length !== 1)
    throw new Error(
      "Give one of --month YYYY-MM, --round YYYY-MM-DD or --round-check",
    );
  if (keys[0] === "--round-check") return ROUND_CHECK_TITLE;
  if (keys[0] === "--month")
    return monthlyFailureTitle(flagIn(argv, "--month"));
  return roundFailureTitle(flagIn(argv, "--round"));
}

function runUrl(): string {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  return GITHUB_RUN_ID
    ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`
    : "(run URL unavailable)";
}

function main(): void {
  const mode = process.argv[2];
  const title = titleFromArgs(process.argv.slice(3));
  const gh = realGh();
  if (mode === "report") {
    const log = readFileSync(flag("--log"), "utf8");
    const body = failureBody(process.env.FAILED_STEP ?? "", log, runUrl());
    console.log(reportFailure(gh, title, body).kind);
  } else if (mode === "resolve") {
    console.log(resolveFailure(gh, title, runUrl()) ? "closed" : "none open");
  } else {
    throw new Error(
      "Usage: failure-issue.ts report|resolve (--month YYYY-MM | --round YYYY-MM-DD | --round-check)",
    );
  }
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("failure-issue.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
