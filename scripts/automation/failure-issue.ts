// Usage:
//   tsx scripts/automation/failure-issue.ts report --title <t> --log <file>
//   tsx scripts/automation/failure-issue.ts resolve --title <t>
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
  const [year, m] = month.split("-");
  return `Monthly SkillSelect update failed (${MONTHS[Number(m) - 1]} ${year})`;
}

/** `189 round import failed (10 Nov 2026)` for a `YYYY-MM-DD` round date. */
export function roundFailureTitle(date: string): string {
  const [year, m, d] = date.split("-");
  return `189 round import failed (${Number(d)} ${MONTHS[Number(m) - 1]} ${year})`;
}

export function failureIssueAction(
  open: OpenIssue[],
  title: string,
): FailureAction {
  const existing = open.find((issue) => issue.title === title);
  return existing
    ? { kind: "comment", number: existing.number }
    : { kind: "create" };
}

export function failureBody(step: string, log: string, runUrl: string): string {
  const tail = log.split("\n").slice(-LOG_LINES).join("\n").trimEnd();
  return [
    `Failing step: ${step || "unknown"}`,
    `Run: ${runUrl}`,
    "",
    `Last ${LOG_LINES} log lines:`,
    "",
    "```",
    tail,
    "```",
  ].join("\n");
}

function openIssues(gh: Gh): OpenIssue[] {
  return JSON.parse(
    gh([
      "issue",
      "list",
      "--state",
      "open",
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
    gh([
      "issue",
      "create",
      "--title",
      title,
      "--body",
      body,
      "--assignee",
      FOUNDER,
    ]);
  else gh(["issue", "comment", String(action.number), "--body", body]);
  return action;
}

/** Closes the open issue with this title, if any; true when one was closed. */
export function resolveFailure(gh: Gh, title: string, runUrl: string): boolean {
  const action = failureIssueAction(openIssues(gh), title);
  if (action.kind === "create") return false;
  gh([
    "issue",
    "close",
    String(action.number),
    "--comment",
    `Resolved: a later run succeeded. ${runUrl}`,
  ]);
  return true;
}

function flag(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index === -1 ? undefined : process.argv[index + 1];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function runUrl(): string {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  return GITHUB_RUN_ID
    ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`
    : "(run URL unavailable)";
}

function main(): void {
  const mode = process.argv[2];
  const title = flag("--title");
  const gh = realGh();
  if (mode === "report") {
    const log = readFileSync(flag("--log"), "utf8");
    const body = failureBody(process.env.FAILED_STEP ?? "", log, runUrl());
    console.log(reportFailure(gh, title, body).kind);
  } else if (mode === "resolve") {
    console.log(resolveFailure(gh, title, runUrl()) ? "closed" : "none open");
  } else {
    throw new Error("Usage: failure-issue.ts report|resolve --title <t>");
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
