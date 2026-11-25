// Usage: tsx scripts/automation/base-branch.ts --fresh <branch>
// Prints `branch=…` and `pr=…` lines for $GITHUB_OUTPUT. At most one
// `data-update` pull request may be open: a job that finds one works on its
// branch and appends to it; none means the job starts `fresh`.
import { realGh, type Gh } from "./gh";

export type OpenPr = { number: number; headRefName: string };

export type BaseChoice =
  | { kind: "join"; branch: string; number: number }
  | { kind: "new"; branch: string };

export function chooseBase(open: OpenPr[], fresh: string): BaseChoice {
  if (open.length > 1) {
    const numbers = open.map((pr) => `#${pr.number}`).join(", ");
    throw new Error(`More than one open data-update pull request: ${numbers}`);
  }
  const [pr] = open;
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
    "number,headRefName",
  ]);
  return JSON.parse(out) as OpenPr[];
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
  console.log(outputLines(choice).join("\n"));
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
