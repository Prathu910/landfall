import { describe, expect, it } from "vitest";
import {
  chooseBase,
  isHeld,
  listOpenDataUpdates,
  onOrigin,
  outputLines,
} from "./base-branch";

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
  it("prints branch and pr lines", () => {
    expect(outputLines({ kind: "new", branch: "b" })).toEqual([
      "branch=b",
      "pr=",
    ]);
    expect(outputLines({ kind: "join", branch: "b", number: 7 })).toEqual([
      "branch=b",
      "pr=7",
    ]);
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

describe("isHeld", () => {
  const fresh = { kind: "new", branch: "data/skillselect-2026-11" } as const;
  it("holds a fresh branch that is already on origin (its PR was closed)", () => {
    expect(isHeld(fresh, true)).toBe(true);
    expect(isHeld(fresh, false)).toBe(false);
  });
  it("never holds a join: the open PR's branch is always on origin", () => {
    expect(isHeld({ kind: "join", branch: "data/x", number: 3 }, true)).toBe(
      false,
    );
  });
});

describe("onOrigin", () => {
  it("asks ls-remote for the exact head and reads its exit code", () => {
    const calls: string[][] = [];
    const git = (status: number | null) => (args: string[]) => {
      calls.push(args);
      return status;
    };
    expect(onOrigin("data/skillselect-2026-11", git(0))).toBe(true);
    expect(onOrigin("data/skillselect-2026-11", git(2))).toBe(false);
    expect(calls[0]).toEqual([
      "ls-remote",
      "--exit-code",
      "--heads",
      "origin",
      "refs/heads/data/skillselect-2026-11",
    ]);
    expect(() => onOrigin("b", git(128))).toThrow(/exit 128/);
  });
});
