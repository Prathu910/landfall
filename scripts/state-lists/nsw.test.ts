// Fixture captured 2026-11-18 from the NSW Skills Lists page, trimmed to the
// unit group table's header and eight of its 78 rows, kept as the site wrote
// them.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isImportedList } from "../../src/lib/state-outlook/rules-guards";
import { buildNswList, parseNswUnitGroups } from "./nsw";

const html = readFileSync(
  new URL("./__fixtures__/nsw.html", import.meta.url),
  "utf8",
);

const ALL = ["living-in-state", "living-in-other-state", "offshore"];
const meta = { source: "https://example.gov.au/", checkedAt: "2026-11-18" };

function groups(...rows: [string, string][]): string {
  const body = rows
    .map(([code, name]) => `<tr><td>${code}</td><td>${name}</td></tr>`)
    .join("");
  return `<table><tbody><tr><td>ANZSCO Code</td><td>Unit Group Name</td></tr>${body}</tbody></table>`;
}
const indexOf = (...codes: string[]) => codes.map((code) => ({ code }));

describe("parseNswUnitGroups", () => {
  it("reads the four-digit codes from the fixture", () => {
    expect(parseNswUnitGroups(html)).toEqual([
      "1213",
      "2332",
      "2333",
      "2336",
      "2411",
      "2414",
      "2544",
      "2613",
    ]);
  });

  it("throws when the page has no unit group table", () => {
    expect(() =>
      parseNswUnitGroups("<table><tr><td>x</td></tr></table>"),
    ).toThrow(/unit group/i);
  });

  it("throws on a code that is not four digits", () => {
    expect(() => parseNswUnitGroups(groups(["261313", "x"]))).toThrow(/261313/);
  });

  it("keeps a duplicated unit group once", () => {
    expect(parseNswUnitGroups(groups(["2613", "a"], ["2613", "a"]))).toEqual([
      "2613",
    ]);
  });
});

describe("buildNswList", () => {
  const index = indexOf("261312", "261313", "233211", "233512", "351311");

  it("lists 261313 through unit group 2613 for 190 in every cohort", () => {
    const { list } = buildNswList(html, index, meta);
    expect(list.entries["261313"]).toEqual({
      "190": ALL,
      streams: ["nsw-skills-list"],
      viaUnitGroup: "2613",
    });
    expect(list.entries["261312"].viaUnitGroup).toBe("2613");
    expect(list.entries["233211"].viaUnitGroup).toBe("2332");
  });

  it("never emits 491", () => {
    const { list } = buildNswList(html, index, meta);
    for (const entry of Object.values(list.entries)) {
      expect(entry["491"]).toBeUndefined();
    }
  });

  it("leaves out codes in unit groups that are not listed", () => {
    const { list } = buildNswList(html, index, meta);
    expect(list.entries["233512"]).toBeUndefined();
    expect(list.entries["351311"]).toBeUndefined();
  });

  it("passes the list guard", () => {
    expect(isImportedList(buildNswList(html, index, meta).list)).toBe(true);
  });

  it("reports a unit group that matches no indexed code", () => {
    const { unmatched } = buildNswList(html, index, meta);
    expect(unmatched).toEqual(["1213", "2333", "2336", "2411", "2414", "2544"]);
  });

  it("maps a prefix only, not a containing number", () => {
    const { list } = buildNswList(
      groups(["2613", "x"]),
      indexOf("126130", "261399"),
      meta,
    );
    expect(Object.keys(list.entries)).toEqual(["261399"]);
  });
});
