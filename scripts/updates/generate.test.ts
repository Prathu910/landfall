import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listRecapMonths } from "../../src/lib/updates/load-server";
import {
  checkPreviousManifest,
  keepAddedAndRemoved,
  loadAllCores,
  parseGenerateArgs,
} from "./generate";
import { buildDataSection } from "../../src/lib/updates/facts-data";
import { loadManifest } from "../../src/lib/data/load-server";
import type { Manifest } from "../../src/lib/data/types";
import type { DataSection } from "../../src/lib/updates/types";

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

describe("checkPreviousManifest", () => {
  const manifest = (asAt: string) => ({ asAt }) as Manifest;
  it("accepts last month's manifest", () => {
    expect(checkPreviousManifest(manifest("2026-09"), "2026-10").asAt).toBe(
      "2026-09",
    );
  });
  it("rejects this month's own manifest and others", () => {
    expect(() => checkPreviousManifest(manifest("2026-10"), "2026-10")).toThrow(
      "not 2026-09",
    );
    expect(() => checkPreviousManifest(manifest("2026-08"), "2026-10")).toThrow(
      "--previous-manifest",
    );
  });
});

describe("keepAddedAndRemoved", () => {
  const added = [{ code: "111111", name: "A" }];
  const removed = [{ code: "222222", name: "B" }];
  const kept = { occupationsAdded: added, occupationsRemoved: removed };
  const fresh = { occupationsAdded: null, occupationsRemoved: null };
  const as = (v: object) => v as DataSection;
  it("keeps the first run's lists when no previous manifest is given", () => {
    expect(keepAddedAndRemoved(as(fresh), as(kept), null)).toMatchObject(kept);
  });
  it("uses the fresh lists when a previous manifest is given", () => {
    const withPrev = as({ occupationsAdded: [], occupationsRemoved: [] });
    expect(keepAddedAndRemoved(withPrev, as(kept), {} as Manifest)).toBe(
      withPrev,
    );
  });
  it("leaves a first run alone", () => {
    expect(keepAddedAndRemoved(as(fresh), null, null)).toEqual(fresh);
  });
});

describe("loadAllCores and the 2026-10 maxima", () => {
  const manifest = loadManifest();
  it("includes hasData:false occupations that have a core file", () => {
    const cores = loadAllCores();
    expect(cores.length).toBe(493);
  });
  // Pinned figures belong to the 2026-10 snapshot; skip once the data moves on.
  it.skipIf(manifest.asAt !== "2026-10")(
    "keeps the maxima that count hasData:false cells",
    () => {
      const federal = JSON.parse(
        readFileSync("src/data/state-rules/federal-occupations.json", "utf8"),
      );
      const section = buildDataSection({
        month: "2026-10",
        cores: loadAllCores(),
        manifest,
        previousManifest: null,
        previousFacts: null,
        rounds: JSON.parse(readFileSync("src/data/rounds.json", "utf8")),
        federal,
        today: "2026-11-24",
      });
      expect(section.national["189"].invited.current.max).toBe(16700);
      expect(section.national["189"].submitted.previous?.max).toBe(182311);
      expect(section.national["190"].invited.current.max).toBe(9905);
      expect(section.states["190"].NSW.total.max).toBe(6946);
      expect(section.states["190"].NSW.maskedCells).toBe(324);
    },
  );
});
