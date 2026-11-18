// Fixtures captured 2026-11-18 from the Queensland onshore and offshore
// skilled occupation list pages, trimmed to the table header and a few of the
// rows (the eleven original occupations plus others), kept as the site wrote
// them.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isImportedList } from "../../src/lib/state-outlook/rules-guards";
import { buildQldList, parseQldTable } from "./qld";

function fixture(name: string): string {
  return readFileSync(
    new URL(`./__fixtures__/${name}`, import.meta.url),
    "utf8",
  );
}
const onshoreHtml = fixture("qld-onshore.html");
const offshoreHtml = fixture("qld-offshore.html");

const TICK = '<i class="fas fa-check tick">tick</i>';

function table(headings: string[], ...rows: string[][]): string {
  const head = headings.map((h) => `<th><span>${h}</span></th>`).join("");
  const body = rows
    .map(
      (cells) =>
        `<tr>${cells.map((c) => `<td><div><p>${c}</p></div></td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
const HEADINGS = [
  "ANZSCO Code",
  "Occupation",
  "Skilled Work Regional (Provisional) visa (subclass 491)",
  "Skilled Nominated visa (subclass 190)",
  "Building and Construction pathway",
];
function page(...rows: string[][]): string {
  return table(HEADINGS, ...rows);
}

describe("parseQldTable", () => {
  it("reads the real onshore fixture: 233211 is on both visas", () => {
    const entries = parseQldTable(onshoreHtml);
    expect(entries["233211"]).toEqual({
      "190": true,
      "491": true,
      pathways: { "190": [], "491": [] },
    });
  });

  it("reads a 491-only row", () => {
    const entries = parseQldTable(page(["351311", "Chef", TICK, "", ""]));
    expect(entries["351311"]).toEqual({
      "190": false,
      "491": true,
      pathways: { "190": [], "491": [] },
    });
  });

  it("copes with a tick that has a trailing zero-width space or nbsp", () => {
    const entries = parseQldTable(
      page(["121111", "Aquaculture Farmer", `${TICK}​`, "&nbsp;", "&nbsp;"]),
    );
    expect(entries["121111"]).toEqual({
      "190": false,
      "491": true,
      pathways: { "190": [], "491": [] },
    });
  });

  it("notes the building and construction pathway", () => {
    const entries = parseQldTable(
      page(["331211", "Carpenter", TICK, TICK, `&nbsp;${TICK}`]),
    );
    expect(entries["331211"].pathways).toEqual({
      "190": ["building-and-construction"],
      "491": ["building-and-construction"],
    });
  });

  it("reads an offshore row with only four cells", () => {
    const entries = parseQldTable(
      table(
        [...HEADINGS.slice(0, 4), "Additional information"],
        ["241512", "Teacher", TICK, TICK],
      ),
    );
    expect(entries["241512"]).toEqual({
      "190": true,
      "491": true,
      pathways: { "190": [], "491": [] },
    });
  });

  it("throws when the column headings change", () => {
    const changed = table(
      ["Code", "Name", "A", "B"],
      ["233211", "x", TICK, TICK],
    );
    expect(() => parseQldTable(changed)).toThrow(/headings/);
  });

  it("throws on a visa cell that is neither a tick nor empty", () => {
    expect(() =>
      parseQldTable(page(["233211", "x", "Maybe", TICK, ""])),
    ).toThrow(/233211/);
  });

  it("throws on a code that is not six digits", () => {
    expect(() => parseQldTable(page(["2332", "x", TICK, TICK, ""]))).toThrow(
      /2332/,
    );
  });

  it("throws rather than drop a row with no visa ticked", () => {
    expect(() => parseQldTable(page(["233211", "x", "", "", ""]))).toThrow(
      /review/,
    );
  });

  it("throws when there is no table", () => {
    expect(() => parseQldTable("<p>moved</p>")).toThrow(/table/);
  });

  it("unions a code the table lists twice", () => {
    const entries = parseQldTable(
      page(["233211", "x", TICK, "", ""], ["233211", "x", "", TICK, ""]),
    );
    expect(entries["233211"]).toEqual({
      "190": true,
      "491": true,
      pathways: { "190": [], "491": [] },
    });
  });
});

describe("buildQldList", () => {
  const meta = { source: "https://example.gov.au/", checkedAt: "2026-11-18" };
  const list = buildQldList(onshoreHtml, offshoreHtml, meta).list;

  it("passes the list guard", () => {
    expect(isImportedList(list)).toBe(true);
    expect(list.listId).toBe("qld");
  });

  it("lists 233211 Civil Engineer for 190 and 491, onshore and offshore", () => {
    expect(list.entries["233211"]).toEqual({
      "190": ["living-in-state", "offshore"],
      "491": ["living-in-state", "offshore"],
      streams: {
        "190": ["onshore", "offshore"],
        "491": ["onshore", "offshore"],
      },
    });
  });

  it("gives an onshore-only code only the living-in-state cohort", () => {
    expect(list.entries["261313"]).toEqual({
      "190": ["living-in-state"],
      "491": ["living-in-state"],
      streams: { "190": ["onshore"], "491": ["onshore"] },
    });
  });

  it("lists Chef for 491 only", () => {
    expect(list.entries["351311"]).toEqual({
      "491": ["living-in-state"],
      streams: { "491": ["onshore"] },
    });
  });

  it("does not list codes that are on neither page", () => {
    expect(list.entries["261111"]).toBeUndefined();
  });

  it("gives an offshore-only 190 code the offshore cohort", () => {
    const offshoreOnly = buildQldList(
      page(["233211", "x", TICK, TICK, ""]),
      page(["133111", "y", TICK, TICK, ""]),
      meta,
    ).list;
    expect(offshoreOnly.entries["133111"]).toEqual({
      "190": ["offshore"],
      "491": ["offshore"],
      streams: { "190": ["offshore"], "491": ["offshore"] },
    });
  });

  it("tags each visa only with the lists that offer that visa", () => {
    const built = buildQldList(
      page(["331211", "Carpenter", "", TICK, TICK]),
      page(["331211", "Carpenter", TICK, "", ""]),
      meta,
    ).list;
    expect(built.entries["331211"].streams).toEqual({
      "190": ["onshore", "building-and-construction"],
      "491": ["offshore"],
    });
  });

  it("records a named pathway in the streams", () => {
    const built = buildQldList(
      page(["331211", "Carpenter", TICK, TICK, TICK]),
      page(["233211", "x", TICK, TICK, ""]),
      meta,
    ).list;
    expect(built.entries["331211"].streams).toEqual({
      "190": ["onshore", "building-and-construction"],
      "491": ["onshore", "building-and-construction"],
    });
  });

  it("sorts entries by code", () => {
    const codes = Object.keys(list.entries);
    expect(codes).toEqual([...codes].sort());
  });
});
