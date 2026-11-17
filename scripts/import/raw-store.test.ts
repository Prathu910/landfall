import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decodeRaw,
  encodeRaw,
  readRawView,
  writeRawView,
  type RawViewFile,
} from "./raw-store";

const header = ["Occupation", "Score", "Count"];
const rows = [
  ["Nurse", "90", "12"],
  ["Nurse", "85", "<20"],
  ["Cook", "90", "7"],
];

function file(fetchedAt: string, count = "12"): RawViewFile {
  return {
    viewId: "status-history",
    asAt: "2026-10",
    fetchedAt,
    source: "https://example.test",
    selections: { "EOI Status": ["SUBMITTED"] },
    parts: [
      {
        partition: {},
        table: encodeRaw(header, [["Nurse", "90", count]]),
      },
    ],
  };
}

describe("encodeRaw", () => {
  it("round-trips and keeps the count column as text", () => {
    const table = encodeRaw(header, rows);
    expect(table.dictionaries).toHaveLength(2);
    expect(table.rows[1][2]).toBe("<20");
    expect(decodeRaw(table)).toEqual({ header, rows });
  });
});

describe("raw store", () => {
  it("does not revise identical content", () => {
    const root = mkdtempSync(join(tmpdir(), "raw-"));
    const first = writeRawView(root, file("2026-11-17T01:00:00Z"));
    expect(first.revised).toBe(false);
    const second = writeRawView(root, file("2026-11-18T01:00:00Z"));
    expect(second).toEqual({ path: first.path, revised: false });
  });

  it("writes a dated revision for differing content and reads it back", () => {
    const root = mkdtempSync(join(tmpdir(), "raw-"));
    writeRawView(root, file("2026-11-17T01:00:00Z"));
    const rev = writeRawView(root, file("2026-11-17T05:00:00Z", "13"));
    expect(rev.revised).toBe(true);
    expect(rev.path.endsWith("status-history.rev-2026-11-17.json")).toBe(true);
    const rev2 = writeRawView(root, file("2026-11-17T06:00:00Z", "14"));
    expect(rev2.path.endsWith("status-history.rev-2026-11-17-2.json")).toBe(
      true,
    );
    expect(existsSync(rev2.path)).toBe(true);
    const read = readRawView(root, "2026-10", "status-history");
    expect(decodeRaw(read!.parts[0].table).rows[0][2]).toBe("14");
  });

  it("leaves no partial file when a first write fails partway", () => {
    const root = mkdtempSync(join(tmpdir(), "raw-"));
    const failing = (path: string, text: string): void => {
      writeFileSync(path, text.slice(0, 10));
      throw new Error("disk full");
    };
    expect(() =>
      writeRawView(root, file("2026-11-17T01:00:00Z"), { writeFile: failing }),
    ).toThrow("disk full");
    expect(readdirSync(join(root, "2026-10"))).toEqual([]);
    expect(readRawView(root, "2026-10", "status-history")).toBeUndefined();
  });

  it("keeps the stored view intact when a revision write fails partway", () => {
    const root = mkdtempSync(join(tmpdir(), "raw-"));
    const first = writeRawView(root, file("2026-11-17T01:00:00Z"));
    const before = readFileSync(first.path, "utf8");
    const failing = (path: string, text: string): void => {
      writeFileSync(path, text.slice(0, 10));
      throw new Error("disk full");
    };
    expect(() =>
      writeRawView(root, file("2026-11-18T01:00:00Z", "13"), {
        writeFile: failing,
      }),
    ).toThrow("disk full");
    expect(readdirSync(join(root, "2026-10"))).toEqual(["status-history.json"]);
    expect(readFileSync(first.path, "utf8")).toBe(before);
  });

  it("returns undefined when nothing is stored", () => {
    const root = mkdtempSync(join(tmpdir(), "raw-"));
    expect(readRawView(root, "2026-10", "cohorts")).toBeUndefined();
  });
});
