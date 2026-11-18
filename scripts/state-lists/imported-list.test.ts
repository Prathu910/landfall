import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeImportedList } from "./imported-list";

describe("writeImportedList", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("writes the list as JSON ending in a newline", () => {
    dir = mkdtempSync(join(tmpdir(), "imported-"));
    const path = join(dir, "wa.json");
    const list = {
      listId: "wa",
      source: "https://example.gov.au/wa",
      checkedAt: "2026-11-18",
      entries: { "261313": { "190": ["offshore" as const] } },
    };
    writeImportedList(path, list);
    const text = readFileSync(path, "utf8");
    expect(text.endsWith("}\n")).toBe(true);
    expect(JSON.parse(text)).toEqual(list);
  });

  it("refuses to write a list the guard rejects", () => {
    dir = mkdtempSync(join(tmpdir(), "imported-"));
    const path = join(dir, "wa.json");
    const bad = {
      listId: "",
      source: "s",
      checkedAt: "2026-11-18",
      entries: {},
    };
    expect(() => writeImportedList(path, bad)).toThrow();
    expect(() => readFileSync(path)).toThrow();
  });
});
