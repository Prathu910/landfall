// Fixture captured 2026-11-18 from the WA occupation search CSV export,
// trimmed to the header and 27 of its 669 rows (the eleven original
// occupations plus two others), kept as the site wrote them.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isImportedList } from "../../src/lib/state-outlook/rules-guards";
import { assertListSize } from "./imported-list";
import { buildWaList, parseWaCsv } from "./wa";

const csv = readFileSync(
  new URL("./__fixtures__/wa.csv", import.meta.url),
  "utf8",
);

const HEADER =
  'Occupation,"Industry Sector",ANZSCO,Stream,"Minimum Points","Priority Occupation","Regional WA only",Status,v190,v491';
const ALL = ["living-in-state", "living-in-other-state", "offshore"];

function csvWith(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

function line(code: string, stream: string, v190 = "Yes", v491 = "Yes") {
  return `Job ${code},Sector,${code},"${stream}",65,No,No,Available,${v190},${v491}`;
}

describe("parseWaCsv", () => {
  const entries = parseWaCsv(csv);

  it("lists Software Engineer for 190 and 491 in every cohort", () => {
    expect(entries["261313"]).toEqual({
      "190": ALL,
      "491": ALL,
      streams: ["schedule-2", "graduate"],
    });
  });

  it("records Schedule 1 for Registered Nurses nec", () => {
    expect(entries["254499"].streams).toContain("schedule-1");
    expect(entries["254499"]["190"]).toEqual(ALL);
  });

  it("merges a Defence row that is 190-only with the general rows", () => {
    expect(entries["233512"]).toEqual({
      "190": ALL,
      "491": ALL,
      streams: ["schedule-2", "schedule-3", "graduate"],
    });
  });

  it("leaves a visa out when no row of the code offers it", () => {
    expect(entries["223111"]?.["190"]).toBeUndefined();
    expect(entries["223111"]?.["491"]).toEqual(ALL);
  });

  it("omits a code that no row offers for either visa", () => {
    const none = parseWaCsv(csvWith(line("261313", "Graduate", "No", "No")));
    expect(none["261313"]).toBeUndefined();
  });

  it("leaves an unlisted code absent", () => {
    expect(entries["999999"]).toBeUndefined();
  });

  it("handles CRLF line endings and quoted commas", () => {
    const parsed = parseWaCsv(
      `${HEADER}\r\n"Job, nec","Sector, big",261313,Graduate,65,No,No,Available,Yes,No\r\n`,
    );
    expect(parsed["261313"]).toEqual({
      "190": ALL,
      streams: ["graduate"],
    });
  });

  it("throws when the columns change", () => {
    expect(() => parseWaCsv(csv.replace("v190", "visa190"))).toThrow(/column/i);
  });

  it("throws on an empty file", () => {
    expect(() => parseWaCsv("")).toThrow(/review/);
  });

  it("throws on an unknown stream", () => {
    expect(() => parseWaCsv(csvWith(line("261313", "Mystery")))).toThrow(
      /Mystery/,
    );
  });

  it("throws on a status other than Available", () => {
    const row = line("261313", "Graduate").replace("Available", "Closed");
    expect(() => parseWaCsv(csvWith(row))).toThrow(/Closed/);
  });

  it("throws on a visa cell that is not Yes or No", () => {
    expect(() =>
      parseWaCsv(csvWith(line("261313", "Graduate", "Maybe"))),
    ).toThrow(/Maybe/);
  });

  it("throws on a code that is not six digits", () => {
    expect(() => parseWaCsv(csvWith(line("2613", "Graduate")))).toThrow(/2613/);
  });

  it("throws on a row with the wrong number of cells", () => {
    expect(() => parseWaCsv(csvWith("Job,Sector,261313"))).toThrow(/cells/);
  });
});

describe("buildWaList", () => {
  const meta = { source: "https://example.gov.au/wa", checkedAt: "2026-11-18" };

  it("returns a guard-valid list with sorted codes", () => {
    const list = buildWaList(csv, meta);
    expect(isImportedList(list)).toBe(true);
    expect(list.listId).toBe("wa");
    expect(list.source).toBe(meta.source);
    const codes = Object.keys(list.entries);
    expect(codes).toEqual([...codes].sort());
  });
});

describe("assertListSize", () => {
  const list = { listId: "wa", source: "s", checkedAt: "2026-11-18" };

  it("throws when the list is smaller than the floor", () => {
    expect(() =>
      assertListSize({ ...list, entries: { "261313": {} } }, 250),
    ).toThrow(/review/);
  });

  it("passes at the floor", () => {
    expect(() =>
      assertListSize({ ...list, entries: { "261313": {} } }, 1),
    ).not.toThrow();
  });
});
