// Thin `gh` runner shared by the automation CLIs. With DRY_RUN=1 nothing is
// sent to GitHub: reads return "[]" (or DRY_RUN_OPEN_PRS for `pr list`) and
// writes return "" (R15). Tests inject
// their own runner and never call the real `gh`.
import { execFileSync } from "node:child_process";

/** `input` goes to stdin (used with `--body-file -`). */
export type Gh = (args: string[], input?: string) => string;

const READS = new Set(["list", "view"]);

export function realGh(dryRun = process.env.DRY_RUN === "1"): Gh {
  return (args, input) => {
    if (dryRun) {
      console.error(`DRY_RUN: gh ${args.join(" ")}`);
      // A local test of the join and swap paths names its open PRs.
      const open = process.env.DRY_RUN_OPEN_PRS;
      if (open && args[0] === "pr" && args[1] === "list") return open;
      return READS.has(args[1]) ? "[]" : "";
    }
    return execFileSync("gh", args, { encoding: "utf8", input });
  };
}
