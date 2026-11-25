import { describe, expect, it } from "vitest";
import {
  chooseBase,
  closedUnmerged,
  freshState,
  isHeld,
  listOpenDataUpdates,
  originTip,
  outputLines,
} from "./base-branch";

const SHA = "0123456789abcdef0123456789abcdef01234567";
const NONE = { tip: null, closedUnmerged: false };
const CLOSED = { tip: SHA, closedUnmerged: true };
const NO_PR = { tip: SHA, closedUnmerged: false };

describe("chooseBase", () => {
  it("starts a new branch when nothing is open", () => {
    expect(chooseBase([], "data/skillselect-2026-11")).toEqual({
      kind: "new",
      branch: "data/skillselect-2026-11",
    });
  });

  it("joins the one open pull request", () => {
    expect(
      chooseBase(
        [{ number: 12, headRefName: "data/round-2026-12-10" }],
        "data/skillselect-2026-11",
      ),
    ).toEqual({ kind: "join", branch: "data/round-2026-12-10", number: 12 });
  });

  it("rejects fork pull requests and odd branch names", () => {
    expect(() =>
      chooseBase(
        [{ number: 5, headRefName: "data/x", isCrossRepository: true }],
        "f",
      ),
    ).toThrow("comes from a fork");
    for (const name of ["main", "data/a b", "data/x;rm", "feature/x"])
      expect(() => chooseBase([{ number: 5, headRefName: name }], "f")).toThrow(
        "unexpected branch name",
      );
  });

  it("stops on more than one", () => {
    expect(() =>
      chooseBase(
        [
          { number: 12, headRefName: "a" },
          { number: 13, headRefName: "b" },
        ],
        "x",
      ),
    ).toThrow("More than one open data-update pull request: #12, #13");
  });
});

describe("outputs and listing", () => {
  const fresh = "data/skillselect-2026-11";
  it("prints branch, pr, held and tip lines", () => {
    expect(outputLines({ kind: "new", branch: fresh }, NONE, fresh)).toEqual([
      `branch=${fresh}`,
      "pr=",
      "held=no",
      "tip=",
    ]);
    expect(
      outputLines({ kind: "join", branch: "b", number: 7 }, NONE, fresh),
    ).toEqual(["branch=b", "pr=7", "held=no", "tip="]);
  });

  it("gives the tip a run replaces: a branch left with no pull request", () => {
    expect(outputLines({ kind: "new", branch: fresh }, NO_PR, fresh)).toEqual([
      `branch=${fresh}`,
      "pr=",
      "held=no",
      `tip=${SHA}`,
    ]);
    // Joining another PR: the fresh branch isn't pushed, so no tip.
    expect(
      outputLines(
        { kind: "join", branch: "data/round-2026-12-10", number: 12 },
        NO_PR,
        fresh,
      ).at(-1),
    ).toBe("tip=");
  });

  it("asks gh for open data-update pull requests", () => {
    const calls: string[][] = [];
    const open = listOpenDataUpdates((args) => {
      calls.push(args);
      return '[{"number":3,"headRefName":"x"}]';
    });
    expect(open).toEqual([{ number: 3, headRefName: "x" }]);
    expect(calls[0]).toEqual(
      expect.arrayContaining(["pr", "list", "data-update", "open"]),
    );
  });
});

describe("closedUnmerged", () => {
  const branch = "data/skillselect-2026-11";
  const gh = (json: unknown) => (args: string[]) => {
    expect(args).toEqual([
      "pr",
      "list",
      "--head",
      branch,
      "--state",
      "closed",
      "--json",
      "number,mergedAt,headRefName,isCrossRepository",
    ]);
    return JSON.stringify(json);
  };
  it("finds a pull request closed without merging", () => {
    expect(
      closedUnmerged(
        gh([{ number: 4, mergedAt: null, headRefName: branch }]),
        branch,
      ),
    ).toBe(true);
    expect(
      closedUnmerged(
        gh([{ number: 4, mergedAt: "", headRefName: branch }]),
        branch,
      ),
    ).toBe(true);
  });
  it("ignores merged pull requests, forks and other branches", () => {
    for (const pr of [
      { number: 4, mergedAt: "2026-12-03T01:00:00Z", headRefName: branch },
      {
        number: 5,
        mergedAt: null,
        headRefName: branch,
        isCrossRepository: true,
      },
      { number: 6, mergedAt: null, headRefName: "data/skillselect-2026-1" },
    ])
      expect(closedUnmerged(gh([pr]), branch)).toBe(false);
    expect(closedUnmerged(gh([]), branch)).toBe(false);
  });
});

describe("isHeld", () => {
  const fresh = "data/skillselect-2026-11";
  const start = { kind: "new", branch: fresh } as const;
  it("holds a fresh branch on origin whose PR was closed unmerged", () => {
    expect(isHeld(start, fresh, CLOSED)).toBe(true);
    expect(isHeld(start, fresh, NONE)).toBe(false);
  });
  it("doesn't hold a branch with no pull request (a failed pr create)", () => {
    expect(isHeld(start, fresh, NO_PR)).toBe(false);
  });
  it("holds the month even when another data PR (a round) is open", () => {
    const round = {
      kind: "join",
      branch: "data/round-2026-12-10",
      number: 12,
    } as const;
    expect(isHeld(round, fresh, CLOSED)).toBe(true);
    expect(isHeld(round, fresh, NO_PR)).toBe(false);
    expect(isHeld(round, fresh, NONE)).toBe(false);
  });
  it("doesn't hold when the open PR is the month's own branch", () => {
    expect(
      isHeld({ kind: "join", branch: fresh, number: 3 }, fresh, CLOSED),
    ).toBe(false);
  });
});

describe("originTip and freshState", () => {
  const branch = "data/skillselect-2026-11";
  const git =
    (status: number | null, stdout = "") =>
    (args: string[]) => {
      expect(args).toEqual([
        "ls-remote",
        "--exit-code",
        "--heads",
        "origin",
        `refs/heads/${branch}`,
      ]);
      return { status, stdout };
    };
  it("reads the branch's commit from ls-remote, or null for none", () => {
    expect(originTip(branch, git(0, `${SHA}\trefs/heads/${branch}\n`))).toBe(
      SHA,
    );
    expect(originTip(branch, git(2))).toBeNull();
    expect(() => originTip(branch, git(128))).toThrow(/exit 128/);
    expect(() => originTip(branch, git(0, "garbage"))).toThrow(/no commit/);
  });
  it("asks gh about closed PRs only when origin has the branch", () => {
    const calls: string[][] = [];
    const gh = (args: string[]) => {
      calls.push(args);
      return "[]";
    };
    expect(freshState(branch, gh, git(2))).toEqual(NONE);
    expect(calls).toEqual([]);
    expect(
      freshState(branch, gh, git(0, `${SHA}\trefs/heads/${branch}\n`)),
    ).toEqual(NO_PR);
    expect(calls).toHaveLength(1);
  });
});
