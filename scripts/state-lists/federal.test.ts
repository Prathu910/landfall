// Fixture captured 2026-11-18 from the live Home Affairs skilled occupation
// list page, trimmed to the PageJSONDataHiddenField input the parser reads and
// to 19 of its 714 rows (re-encoded the way the page encodes them).
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { isFederalList } from "../../src/lib/state-outlook/rules-guards";
import {
  assertPlausible,
  buildFederalList,
  parseFederalList,
  writeFederalList,
} from "./federal";

const page = readFileSync(
  new URL("./__fixtures__/federal.html", import.meta.url),
  "utf8",
);

const VISAS_190_491 =
  "190 - Skilled Nominated   (subclass 190);491 - Skilled Work Regional (provisional) visa (subclass 491) State or Territory nominated;";

type Row = {
  occupation: string;
  anzscocode: string;
  visas: string;
  visacaveats: string;
};

/** Encodes rows the way the official page does. */
function pageWith(rows: Row[]): string {
  const json = JSON.stringify(rows).replace(
    /[<>&']/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  const value = json.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<input type="hidden" id="ctl00_PlaceHolderMain_PageJSONDataHiddenField_Input" value="${value}" />`;
}

function row(code: string, overrides: Partial<Row> = {}): Row {
  return {
    occupation: `Occupation ${code}`,
    anzscocode: `<p>ANZSCO 2013 - all other visas - ${code}</p>`,
    visas: VISAS_190_491,
    visacaveats: "<div><ul><li>190 - Skilled Nominated</li></ul></div>",
    ...overrides,
  };
}

const ORIGINAL_ELEVEN = [
  "261111",
  "261312",
  "261313",
  "221111",
  "233211",
  "233512",
  "233311",
  "254499",
  "351311",
  "241111",
  "241411",
];

describe("parseFederalList", () => {
  const { entries, unlabelled } = parseFederalList(page);

  it("lists Software Engineer as eligible for 190 and 491", () => {
    expect(entries["261313"]).toEqual({ "190": true, "491": true });
  });

  it("gives every entry both booleans", () => {
    expect(Object.keys(entries).length).toBeGreaterThan(10);
    for (const entry of Object.values(entries)) {
      expect(Object.keys(entry).sort()).toEqual(["190", "491"]);
      expect(typeof entry["190"]).toBe("boolean");
      expect(typeof entry["491"]).toBe("boolean");
    }
  });

  it("leaves an unknown code absent", () => {
    expect(entries["999999"]).toBeUndefined();
  });

  it("lists the eleven original occupations for both visas", () => {
    for (const code of ORIGINAL_ELEVEN) {
      expect(entries[code], code).toEqual({ "190": true, "491": true });
    }
  });

  it("separates 491 state nomination from 190", () => {
    expect(entries["231111"]).toEqual({ "190": false, "491": true });
  });

  it("keeps a listed occupation that is open to neither visa", () => {
    expect(entries["411511"]).toEqual({ "190": false, "491": false });
  });

  it("keys entries by the ANZSCO 2013 code, not the 2022 one", () => {
    expect(entries["342411"]).toEqual({ "190": true, "491": true });
    expect(entries["362212"]).toBeDefined();
    expect(entries["362511"]).toBeUndefined();
  });

  it("sets aside 190/491 rows that carry only a 2022-labelled code", () => {
    expect(unlabelled.map((r) => r.occupation).sort()).toEqual([
      "Operating Theatre Technician",
      "Osteopath",
      "Quality Assurance Manager",
    ]);
    const qa = unlabelled.find((r) => r.occupation.startsWith("Quality"));
    expect(qa?.codes2022).toEqual(["139916", "139914"]);
    expect(entries["139914"]).toBeUndefined();
  });

  it("drops a 2022-only row that is open to neither visa", () => {
    expect(entries["311112"]).toBeUndefined();
    expect(unlabelled.some((r) => r.codes2022.includes("311112"))).toBe(false);
  });

  it("throws when the page no longer carries the data field", () => {
    expect(() => parseFederalList("<html></html>")).toThrow(/review/);
  });

  it("throws on an unrecognised 190 or 491 visa label", () => {
    const renamed = row("261313", {
      visas: "190 - Skilled Nominated visa (subclass 190);",
    });
    expect(() => parseFederalList(pageWith([renamed]))).toThrow(/190/);
  });

  it("throws when a caveat applies to 190 or 491", () => {
    const caveated = row("261313", {
      visacaveats:
        "<div><ul><li>190 - Skilled Nominated (subclass 190)<br/><span>caveats apply</span></li></ul></div>",
    });
    expect(() => parseFederalList(pageWith([caveated]))).toThrow(/caveat/);
  });

  it("throws on a row with two different 2013 codes", () => {
    const two = row("261313", {
      anzscocode: "ANZSCO 2013 - 261313 ANZSCO 2013 - 261312",
    });
    expect(() => parseFederalList(pageWith([two]))).toThrow(/261313/);
  });

  it("throws when two rows share a code", () => {
    expect(() =>
      parseFederalList(pageWith([row("261313"), row("261313")])),
    ).toThrow(/261313/);
  });
});

describe("buildFederalList", () => {
  const meta = {
    source: "https://example.gov.au/list",
    checkedAt: "2026-11-18",
  };
  const index = [
    { code: "311214", name: "Operating Theatre Technician" },
    { code: "252112", name: "Osteopath" },
    { code: "139914", name: "Quality Assurance Manager" },
  ];

  it("returns a guard-valid list with sorted codes", () => {
    const { list } = buildFederalList(page, index, meta);
    expect(isFederalList(list)).toBe(true);
    expect(list.source).toBe(meta.source);
    expect(list.checkedAt).toBe("2026-11-18");
    const codes = Object.keys(list.entries);
    expect(codes).toEqual([...codes].sort());
  });

  it("maps a 2022-labelled row when the dashboard has that code and name", () => {
    const { list, unmatched } = buildFederalList(page, index, meta);
    expect(list.entries["139914"]).toEqual({ "190": true, "491": true });
    expect(list.entries["139916"]).toBeUndefined();
    expect(list.entries["311214"]).toBeDefined();
    expect(list.entries["252112"]).toBeDefined();
    expect(unmatched).toEqual([]);
  });

  it("leaves out and reports a 2022-labelled row whose name differs", () => {
    const renamed = [{ code: "252112", name: "Osteopathic Physician" }];
    const { list, unmatched } = buildFederalList(page, renamed, meta);
    expect(list.entries["252112"]).toBeUndefined();
    expect(unmatched.map((r) => r.occupation)).toContain("Osteopath");
  });
});

describe("assertPlausible", () => {
  const list = {
    source: "https://example.gov.au/list",
    checkedAt: "2026-11-18",
    entries: {
      "261313": { "190": true, "491": true },
      "231111": { "190": false, "491": true },
      "411511": { "190": false, "491": false },
    },
  };

  it("accepts a list with enough eligible codes for each visa", () => {
    expect(() => assertPlausible(list, 1)).not.toThrow();
  });

  it("throws when either visa has too few eligible codes", () => {
    expect(() => assertPlausible(list, 2)).toThrow(/190/);
  });
});

describe("writeFederalList", () => {
  let dir = "";
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("writes the list as JSON ending in a newline", () => {
    dir = mkdtempSync(join(tmpdir(), "federal-"));
    const path = join(dir, "federal-occupations.json");
    const list = {
      source: "https://example.gov.au/list",
      checkedAt: "2026-11-18",
      entries: { "261313": { "190": true, "491": true } },
    };
    writeFederalList(path, list);
    const text = readFileSync(path, "utf8");
    expect(text.endsWith("}\n")).toBe(true);
    expect(JSON.parse(text)).toEqual(list);
  });

  it("refuses to write a list the guard rejects", () => {
    dir = mkdtempSync(join(tmpdir(), "federal-"));
    const path = join(dir, "federal-occupations.json");
    const bad = { source: "", checkedAt: "2026-11-18", entries: {} };
    expect(() => writeFederalList(path, bad)).toThrow();
    expect(() => readFileSync(path)).toThrow();
  });
});
