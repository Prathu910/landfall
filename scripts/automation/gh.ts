// Thin `gh` runner shared by the automation CLIs. With DRY_RUN=1 nothing is
// sent to GitHub: reads return "[]" and writes return "" (R15). Tests inject
// their own runner and never call the real `gh`.
import { execFileSync } from "node:child_process";

export type Gh = (args: string[]) => string;

const READS = new Set(["list", "view"]);

export function realGh(dryRun = process.env.DRY_RUN === "1"): Gh {
  return (args) => {
    if (dryRun) {
      console.error(`DRY_RUN: gh ${args.join(" ")}`);
      return READS.has(args[1]) ? "[]" : "";
    }
    return execFileSync("gh", args, { encoding: "utf8" });
  };
}
