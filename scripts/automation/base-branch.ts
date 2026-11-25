// Usage: tsx scripts/automation/base-branch.ts --fresh <branch>
// Prints `branch=…`, `pr=…` and `held=…` lines for $GITHUB_OUTPUT. At most
// one `data-update` pull request may be open: a job that finds one works on
// its branch and appends to it; none means the job starts `fresh`, unless
// `fresh` is already on origin (its pull request was closed: `held=yes`).
import { spawnSync } from "node:child_process";
import { realGh, type Gh } from "./gh";

export type OpenPr = {
  number: number;
  headRefName: string;
  isCrossRepository?: boolean;
};

const DATA_BRANCH = /^data\/[a-z0-9-]+$/;

export type BaseChoice =
  | { kind: "join"; branch: string; number: number }
  | { kind: "new"; branch: string };

export function chooseBase(open: OpenPr[], fresh: string): BaseChoice {
  if (open.length > 1) {
    const numbers = open.map((pr) => `#${pr.number}`).join(", ");
    throw new Error(`More than one open data-update pull request: ${numbers}`);
  }
  const [pr] = open;
  if (pr && pr.isCrossRepository)
    throw new Error(`Pull request #${pr.number} comes from a fork`);
  if (pr && !DATA_BRANCH.test(pr.headRefName))
    throw new Error(
      `Pull request #${pr.number} has an unexpected branch name: ${pr.headRefName}`,
    );
  return pr
    ? { kind: "join", branch: pr.headRefName, number: pr.number }
    : { kind: "new", branch: fresh };
}

/** The open `data-update` pull requests, via `gh`. */
export function listOpenDataUpdates(gh: Gh): OpenPr[] {
  const out = gh([
    "pr",
    "list",
    "--label",
    "data-update",
    "--state",
    "open",
    "--json",
    "number,headRefName,isCrossRepository",
  ]);
  return JSON.parse(out) as OpenPr[];
}

/**
 * Controller ruling (Plan 3 Task 6): closing a data PR holds its update. The
 * month's own `fresh` branch on origin, when it isn't the branch of the PR
 * being joined, belongs to a closed PR, so the job imports nothing (not even
 * into another open data PR) until the founder deletes it.
 */
export function isHeld(
  choice: BaseChoice,
  fresh: string,
  freshOnOrigin: boolean,
): boolean {
  const joiningFresh = choice.kind === "join" && choice.branch === fresh;
  return freshOnOrigin && !joiningFresh;
}

/** Runs git and returns its exit status. */
export type GitStatus = (args: string[]) => number | null;

const realGitStatus: GitStatus = (args) =>
  spawnSync("git", args, { stdio: ["ignore", "ignore", "inherit"] }).status;

/** Whether origin has the branch; `git ls-remote --exit-code` exits 2 for none. */
export function onOrigin(
  branch: string,
  git: GitStatus = realGitStatus,
): boolean {
  const status = git([
    "ls-remote",
    "--exit-code",
    "--heads",
    "origin",
    `refs/heads/${branch}`,
  ]);
  if (status === 0) return true;
  if (status === 2) return false;
  throw new Error(`git ls-remote origin failed (exit ${status})`);
}

/** The `$GITHUB_OUTPUT` lines for a choice; `pr=` is empty for a new branch. */
export function outputLines(choice: BaseChoice): string[] {
  return [
    `branch=${choice.branch}`,
    `pr=${choice.kind === "join" ? choice.number : ""}`,
  ];
}

function main(): void {
  const index = process.argv.indexOf("--fresh");
  const fresh = index === -1 ? undefined : process.argv[index + 1];
  if (!fresh) throw new Error("Usage: base-branch.ts --fresh <branch>");
  const choice = chooseBase(listOpenDataUpdates(realGh()), fresh);
  const held = isHeld(choice, fresh, onOrigin(fresh));
  console.log(
    [...outputLines(choice), `held=${held ? "yes" : "no"}`].join("\n"),
  );
}

// tsx runs this file as CommonJS, so there is no top-level await.
if (process.argv[1]?.endsWith("base-branch.ts")) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
