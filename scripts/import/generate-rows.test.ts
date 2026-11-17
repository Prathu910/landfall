import { describe, expect, it } from "vitest";
import { HEADERS, SOFTWARE_ENGINEER } from "./generate-fixture";
import { parseViewRows } from "./generate-rows";
import { VISA_NAMES } from "./qlik-constants";
import { encodeRaw, type RawViewFile } from "./raw-store";
import { VIEWS } from "./views";

const statusHistory = VIEWS.find((view) => view.id === "status-history")!;

function file(rows: string[][]): RawViewFile {
  return {
    viewId: "status-history",
    asAt: "2026-04",
    fetchedAt: "2026-11-17T00:00:00Z",
    source: "https://example.test",
    selections: {},
    parts: [{ partition: {}, table: encodeRaw(HEADERS.byOccupation, rows) }],
  };
}

describe("parseViewRows", () => {
  it("skips EOIs with no occupation, which belong to no occupation record", () => {
    const rows = parseViewRows(
      statusHistory,
      file([
        ["04/2026", VISA_NAMES["491"], "None Provided", "SUBMITTED", "<20"],
        ["04/2026", VISA_NAMES["189"], SOFTWARE_ENGINEER, "SUBMITTED", "9001"],
      ]),
    );
    expect(rows.map((row) => row.code)).toEqual(["261313"]);
  });

  it("still rejects any other occupation text without a code", () => {
    expect(() =>
      parseViewRows(
        statusHistory,
        file([
          ["04/2026", VISA_NAMES["189"], "Software Engineer", "SUBMITTED", "1"],
        ]),
      ),
    ).toThrow(/is not "<code> <name>"/);
  });
});
