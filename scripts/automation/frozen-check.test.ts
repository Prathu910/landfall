import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkFrozen,
  listBaseFiles,
  readBaseFile,
  verifyBase,
} from "./frozen-check";
import { isRecapFacts } from "../../src/lib/updates/guards";

const parsed: unknown = JSON.parse(
  readFileSync("src/data/updates/2026-10.json", "utf8"),
);
if (!isRecapFacts(parsed)) throw new Error("bad fixture");
const oct = parsed;

describe("frozen-check", () => {
  it("fails on a ref that is not a commit", () => {
    expect(() => verifyBase("origin/mian-nope")).toThrow(
      "Base ref origin/mian-nope is not a commit",
    );
    expect(() => verifyBase("HEAD")).not.toThrow();
  });

  it("treats a file absent on base as new, not as an error", () => {
    expect(readBaseFile("HEAD", "src/data/updates/1999-01.json")).toBeNull();
    expect(
      readBaseFile("HEAD", "src/data/updates/2026-10.json"),
    ).not.toBeNull();
    expect(listBaseFiles("HEAD")).toContain("2026-10.json");
  });

  it("passes a new file and reports a deleted one", () => {
    const head = new Map([["2026-11.json", oct]]);
    expect(checkFrozen(head, [], () => null)).toEqual([]);
    expect(checkFrozen(new Map(), ["2026-10.json"], () => oct)).toEqual([
      "2026-10:file",
    ]);
    expect(
      checkFrozen(
        new Map(),
        ["2026-10.json"],
        () => oct,
        new Set(["2026-10:file"]),
      ),
    ).toEqual([]);
  });

  it("reports and allows changed sections", () => {
    const head = new Map([["2026-10.json", { ...oct, data: null }]]);
    expect(checkFrozen(head, ["2026-10.json"], () => oct)).toEqual([
      "2026-10:data",
    ]);
    expect(
      checkFrozen(head, ["2026-10.json"], () => oct, new Set(["2026-10:data"])),
    ).toEqual([]);
  });
});
