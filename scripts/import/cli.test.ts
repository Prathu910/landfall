import { describe, expect, it } from "vitest";
import type { Manifest } from "../../src/lib/data/types";
import { generateTarget, parseArgs } from "./cli";
import { generate } from "./generate";
import { buildRawFixture, fixtureInput } from "./generate-fixture";

describe("parseArgs", () => {
  it("requires --as-at", () => {
    expect(() => parseArgs(["--backfill"])).toThrow(/--as-at/);
  });

  it("rejects a month that does not exist", () => {
    expect(() => parseArgs(["--as-at", "2026-13"])).toThrow(/YYYY-MM/);
  });

  it("reads the mode and checked-at date", () => {
    expect(
      parseArgs([
        "--as-at",
        "2026-10",
        "--backfill",
        "--checked-at",
        "2026-11-17",
      ]),
    ).toEqual({
      asAt: "2026-10",
      mode: "backfill",
      probe: false,
      reportFile: null,
      generateOnly: false,
      keepRounds: false,
      roundsOnly: false,
      checkedAt: "2026-11-17",
      roundsHtml: null,
    });
  });

  it("defaults to a monthly import checked today", () => {
    const args = parseArgs(["--as-at", "2026-10"]);
    expect(args.mode).toBe("monthly");
    expect(args.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rejects an invalid checked-at date and unknown flags", () => {
    expect(() =>
      parseArgs(["--as-at", "2026-10", "--checked-at", "2026-02-30"]),
    ).toThrow(/YYYY-MM-DD/);
    expect(() => parseArgs(["--as-at", "2026-10", "--dry-run"])).toThrow(
      /Unknown/,
    );
  });

  it("does not combine --generate-only with --backfill", () => {
    expect(() =>
      parseArgs(["--as-at", "2026-10", "--generate-only", "--backfill"]),
    ).toThrow(/--generate-only/);
  });

  it("reads saved round pages with --generate-only", () => {
    const args = parseArgs([
      "--as-at",
      "2026-10",
      "--generate-only",
      "--rounds-html",
      "scripts/import/__fixtures__",
    ]);
    expect(args.generateOnly).toBe(true);
    expect(args.roundsHtml).toBe("scripts/import/__fixtures__");
  });

  it("rejects --rounds-html without --generate-only or --rounds-only", () => {
    expect(() =>
      parseArgs(["--as-at", "2026-10", "--rounds-html", "pages"]),
    ).toThrow(/--rounds-html needs --generate-only or --rounds-only/);
    expect(() =>
      parseArgs(["--as-at", "2026-10", "--generate-only", "--rounds-html"]),
    ).toThrow(/--rounds-html/);
  });

  it("probes with no month and takes only --report-file", () => {
    const args = parseArgs(["--probe", "--report-file", "out.json"]);
    expect(args).toMatchObject({
      probe: true,
      asAt: null,
      reportFile: "out.json",
    });
    expect(() => parseArgs(["--probe", "--as-at", "2026-10"])).toThrow(
      /--probe/,
    );
    expect(() => parseArgs(["--probe", "--backfill"])).toThrow(/--probe/);
    expect(() => parseArgs(["--probe", "--report-file"])).toThrow(
      /--report-file/,
    );
  });

  it("reads --report-file with an import", () => {
    expect(
      parseArgs(["--as-at", "2026-10", "--report-file", "r.json"]).reportFile,
    ).toBe("r.json");
  });

  it("keeps the stored rounds in a monthly import", () => {
    expect(parseArgs(["--as-at", "2026-11", "--keep-rounds"])).toMatchObject({
      mode: "monthly",
      keepRounds: true,
      roundsOnly: false,
    });
  });

  it("takes --keep-rounds only with a monthly import", () => {
    expect(() =>
      parseArgs(["--as-at", "2026-11", "--backfill", "--keep-rounds"]),
    ).toThrow(/--keep-rounds/);
    expect(() =>
      parseArgs(["--as-at", "2026-11", "--generate-only", "--keep-rounds"]),
    ).toThrow(/--keep-rounds/);
    expect(() =>
      parseArgs(["--as-at", "2026-11", "--keep-rounds", "--rounds-html", "p"]),
    ).toThrow(/--keep-rounds/);
  });

  it("reads --rounds-only with no month, optionally from saved pages", () => {
    expect(
      parseArgs(["--rounds-only", "--checked-at", "2026-11-20"]),
    ).toMatchObject({
      asAt: null,
      mode: "monthly",
      roundsOnly: true,
      generateOnly: false,
      keepRounds: false,
      checkedAt: "2026-11-20",
      roundsHtml: null,
    });
    expect(
      parseArgs(["--rounds-only", "--rounds-html", "pages"]).roundsHtml,
    ).toBe("pages");
  });

  it("rejects --rounds-only with a month or another mode", () => {
    expect(() => parseArgs(["--rounds-only", "--as-at", "2026-11"])).toThrow(
      /--rounds-only/,
    );
    for (const flag of ["--backfill", "--generate-only", "--keep-rounds"]) {
      expect(() => parseArgs(["--rounds-only", flag])).toThrow(/--rounds-only/);
    }
  });
});

describe("generateTarget", () => {
  const rawRoot = buildRawFixture();
  /** The manifest now in src/data: 2026-10, checked 17 Nov 2026. */
  const stored = (extra: Partial<Manifest> = {}): Manifest => ({
    ...generate({ ...fixtureInput, rawRoot }).manifest,
    ...extra,
  });

  it("--rounds-only leaves checkedAt and sets roundsCheckedAt", () => {
    const args = parseArgs(["--rounds-only", "--checked-at", "2026-11-20"]);
    const target = generateTarget(args, stored());
    expect(target).toEqual({
      asAt: "2026-10",
      checkedAt: "2026-11-17",
      roundsCheckedAt: "2026-11-20",
      // The month as its dashboard was checked: no later raw revision.
      revisionsUpTo: "2026-11-17",
    });
    const { manifest } = generate({ ...fixtureInput, rawRoot, ...target });
    expect(manifest).toMatchObject({
      asAt: "2026-10",
      snapshotId: "skillselect-2026-10-31",
      checkedAt: "2026-11-17",
      roundsCheckedAt: "2026-11-20",
    });
  });

  it("--rounds-only needs a stored manifest", () => {
    const args = parseArgs(["--rounds-only"]);
    expect(() => generateTarget(args, null)).toThrow(/manifest/);
  });

  it("a monthly import that reads the round pages checks them with the dashboard", () => {
    const args = parseArgs([
      "--as-at",
      "2026-11",
      "--checked-at",
      "2026-12-17",
    ]);
    expect(
      generateTarget(args, stored({ roundsCheckedAt: "2026-11-20" })),
    ).toEqual({
      asAt: "2026-11",
      checkedAt: "2026-12-17",
      roundsCheckedAt: "2026-12-17",
    });
  });

  it("--keep-rounds and --generate-only keep the date the rounds were last read", () => {
    const keep = parseArgs([
      "--as-at",
      "2026-11",
      "--checked-at",
      "2026-12-17",
      "--keep-rounds",
    ]);
    expect(generateTarget(keep, stored()).roundsCheckedAt).toBe("2026-11-17");
    expect(
      generateTarget(keep, stored({ roundsCheckedAt: "2026-11-20" }))
        .roundsCheckedAt,
    ).toBe("2026-11-20");
    const rebuild = parseArgs([
      "--as-at",
      "2026-10",
      "--checked-at",
      "2026-11-17",
      "--generate-only",
    ]);
    expect(generateTarget(rebuild, stored()).roundsCheckedAt).toBe(
      "2026-11-17",
    );
  });
});
