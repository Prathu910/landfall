import { describe, expect, it } from "vitest";
import { parseArgs } from "./cli";

describe("parseArgs", () => {
  it("runs every importer by default, checked today", () => {
    const args = parseArgs([], "2026-11-18");
    expect(args).toEqual({ only: null, checkedAt: "2026-11-18" });
  });

  it("accepts --only federal and --checked-at", () => {
    const args = parseArgs(
      ["--only", "federal", "--checked-at", "2026-11-17"],
      "2026-11-18",
    );
    expect(args).toEqual({ only: "federal", checkedAt: "2026-11-17" });
  });

  it("accepts --only wa and --only sa", () => {
    expect(parseArgs(["--only", "wa"], "2026-11-18").only).toBe("wa");
    expect(parseArgs(["--only", "sa"], "2026-11-18").only).toBe("sa");
  });

  it("rejects an unknown importer", () => {
    expect(() => parseArgs(["--only", "mars"], "2026-11-18")).toThrow(/mars/);
  });

  it("rejects a date that is not a real calendar day", () => {
    expect(() =>
      parseArgs(["--checked-at", "2026-02-30"], "2026-11-18"),
    ).toThrow(/checked-at/);
  });

  it("rejects an unknown flag", () => {
    expect(() => parseArgs(["--all"], "2026-11-18")).toThrow(/--all/);
  });
});
