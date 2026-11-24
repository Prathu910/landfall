import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listRecapMonths } from "../../src/lib/updates/load-server";
import { parseGenerateArgs } from "./generate";

const base = ["--month", "2026-10", "--today", "2026-11-24"];

describe("parseGenerateArgs", () => {
  it("reads a round section", () => {
    expect(
      parseGenerateArgs([
        ...base,
        "--section",
        "round",
        "--round",
        "2026-10-15",
      ]),
    ).toEqual({
      month: "2026-10",
      today: "2026-11-24",
      section: "round",
      round: "2026-10-15",
    });
  });
  it("reads a data section with its options", () => {
    expect(
      parseGenerateArgs([
        ...base,
        "--section",
        "data",
        "--spotlight",
        "261313",
        "--previous-manifest",
        "old.json",
      ]),
    ).toMatchObject({
      section: "data",
      spotlight: "261313",
      previousManifest: "old.json",
    });
  });
  it("defaults --today to a Sydney date", () => {
    const args = parseGenerateArgs(["--month", "2026-10", "--section", "data"]);
    expect(args.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it.each([
    [["--section", "data"], "--month"],
    [["--month", "2026-13", "--section", "data"], "--month"],
    [["--month", "2026-10"], "--section"],
    [["--month", "2026-10", "--section", "other"], "--section"],
    [["--month", "2026-10", "--section", "round"], "--round"],
    [
      ["--month", "2026-10", "--section", "round", "--round", "15 Oct"],
      "--round",
    ],
    [
      ["--month", "2026-10", "--section", "data", "--round", "2026-10-15"],
      "--round",
    ],
    [
      ["--month", "2026-10", "--section", "data", "--spotlight", "abc"],
      "--spotlight",
    ],
    [
      [
        "--month",
        "2026-10",
        "--section",
        "round",
        "--round",
        "2026-10-15",
        "--spotlight",
        "261313",
      ],
      "--spotlight",
    ],
    [
      ["--month", "2026-10", "--section", "data", "--today", "yesterday"],
      "--today",
    ],
    [["--month", "2026-10", "--section", "data", "--bogus", "x"], "--bogus"],
    [["--month", "2026-10", "--section"], "needs a value"],
    [
      ["--month", "2026-10", "--month", "2026-09", "--section", "data"],
      "twice",
    ],
  ])("rejects %j", (argv, message) => {
    expect(() => parseGenerateArgs(argv)).toThrow(message);
  });
});

describe("listRecapMonths", () => {
  it("lists months newest first and ignores other files", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "recaps-"));
    try {
      for (const name of [
        "2026-09.json",
        "2026-11.json",
        "2026-10.json",
        "notes.txt",
        "2026-1.json",
      ]) {
        writeFileSync(path.join(dir, name), "{}");
      }
      expect(listRecapMonths(dir)).toEqual(["2026-11", "2026-10", "2026-09"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("returns an empty list for a missing folder", () => {
    expect(listRecapMonths(path.join(tmpdir(), "no-such-recaps"))).toEqual([]);
  });
});
