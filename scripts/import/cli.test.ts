import { describe, expect, it } from "vitest";
import { parseArgs } from "./cli";

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
      generateOnly: false,
      checkedAt: "2026-11-17",
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
});
