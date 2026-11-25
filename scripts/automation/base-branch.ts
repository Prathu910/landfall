// Usage: tsx scripts/automation/base-branch.ts --fresh <branch>
// Prints `branch=…`, `pr=…`, `held=…` and `tip=…` lines for $GITHUB_OUTPUT.
// At most one `data-update` pull request may be open: a job that finds one
// works on its branch and appends to it; none means the job starts `fresh`.
// `held=yes` when `fresh` is on origin and its pull request was closed without
// merging. `tip` is the commit `fresh` has on origin when the job will start
// it again (no pull request, or a closed one): the push replaces exactly that.
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

/** A closed pull request from a branch, as `gh pr list --state closed` gives it. */
export type ClosedPr = {
  number: number;
  mergedAt: string | null;
  headRefName?: string;
  isCrossRepository?: boolean;
};

/**
 * Whether this repository has a pull request from `branch` that was closed
 * without merging. A fork's pull request with the same branch name doesn't
 * count.
 */
export function closedUnmerged(gh: Gh, branch: string): boolean {
  const out = gh([
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "closed",
    "--json",
    "number,mergedAt,headRefName,isCrossRepository",
  ]);
  return (JSON.parse(out) as ClosedPr[]).some(
    (pr) => !pr.mergedAt && !pr.isCrossRepository && pr.headRefName === branch,
  );
}

/** What origin has of the fresh branch: its tip, and whether its PR was closed unmerged. */
export type FreshState = { tip: string | null; closedUnmerged: boolean };

/**
 * Controller ruling (Plan 3 Task 6): closing a data PR holds its update. The
 * month's own `fresh` branch on origin, when it isn't the branch of the PR
 * being joined and its PR was closed without merging, holds the month: the
 * job imports nothing (not even into another open data PR) until the founder
 * deletes it. A branch with no pull request at all (a failed `gh pr create`)
 * is not held; the next run starts it again.
 */
export function isHeld(
  choice: BaseChoice,
  fresh: string,
  state: FreshState,
): boolean {
  const joiningFresh = choice.kind === "join" && choice.branch === fresh;
  return state.tip !== null && state.closedUnmerged && !joiningFresh;
}

/** Runs git and returns its exit status and output. */
export type Git = (args: string[]) => { status: number | null; stdout: string };

const realGit: Git = (args) => {
  const run = spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return { status: run.status, stdout: run.stdout ?? "" };
};

const SHA = /^[0-9a-f]{40}$/;

/** The branch's commit on origin, or null when origin hasn't got it (ls-remote exits 2). */
export function originTip(branch: string, git: Git = realGit): string | null {
  const { status, stdout } = git([
    "ls-remote",
    "--exit-code",
    "--heads",
    "origin",
    `refs/heads/${branch}`,
  ]);
  if (status === 2) return null;
  if (status !== 0)
    throw new Error(`git ls-remote origin failed (exit ${status})`);
  const sha = stdout.split("\t")[0].trim();
  if (!SHA.test(sha))
    throw new Error(`git ls-remote gave no commit for ${branch}`);
  return sha;
}

/** The fresh branch's state; asks gh about closed PRs only when origin has the branch. */
export function freshState(
  fresh: string,
  gh: Gh,
  git: Git = realGit,
): FreshState {
  const tip = originTip(fresh, git);
  return { tip, closedUnmerged: tip !== null && closedUnmerged(gh, fresh) };
}

/**
 * The `$GITHUB_OUTPUT` lines for a choice: `pr=` is empty for a new branch,
 * and `tip=` is the fresh branch's commit on origin when the run starts that
 * branch again (empty when joining, or when origin hasn't got it).
 */
export function outputLines(
  choice: BaseChoice,
  state: FreshState,
  fresh: string,
): string[] {
  const held = isHeld(choice, fresh, state);
  const restarts = choice.kind === "new" && choice.branch === fresh;
  return [
    `branch=${choice.branch}`,
    `pr=${choice.kind === "join" ? choice.number : ""}`,
    `held=${held ? "yes" : "no"}`,
    `tip=${restarts && state.tip ? state.tip : ""}`,
  ];
}

function main(): void {
  const index = process.argv.indexOf("--fresh");
  const fresh = index === -1 ? undefined : process.argv[index + 1];
  if (!fresh) throw new Error("Usage: base-branch.ts --fresh <branch>");
  const gh = realGh();
  const choice = chooseBase(listOpenDataUpdates(gh), fresh);
  const joiningFresh = choice.kind === "join" && choice.branch === fresh;
  const state: FreshState = joiningFresh
    ? { tip: null, closedUnmerged: false }
    : freshState(fresh, gh);
  console.log(outputLines(choice, state, fresh).join("\n"));
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
