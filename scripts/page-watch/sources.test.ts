import { describe, expect, it } from "vitest";
import { collectSources, findCitations, groupByUrl } from "./sources";

const OCCUPATION_LIST =
  "https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list";

describe("collectSources", () => {
  const sources = collectSources();

  it("collects every cited page once, sorted", () => {
    expect(sources.length).toBeGreaterThanOrEqual(40);
    const urls = sources.map((s) => s.url);
    expect(urls).toContain(OCCUPATION_LIST);
    expect(new Set(urls).size).toBe(sources.length);
    expect(urls).toEqual([...urls].sort());
    expect(urls.every((url) => url.startsWith("https://"))).toBe(true);
    expect(urls.some((url) => url.includes("#"))).toBe(false);
  });

  it("covers each kind of source with its citing items", () => {
    const citers = (url: string) =>
      sources.find((s) => s.url === url)?.citedBy ?? [];
    // states.ts (its date is `checked`)
    expect(
      citers(
        "https://liveinmelbourne.vic.gov.au/migrate/skilled-migration-visas/vpt",
      ),
    ).toContainEqual({
      file: "src/data/states.ts",
      item: "VIC",
      checkedAt: "17 Nov 2026",
    });
    // a state list importer, dated by its imported list
    expect(
      citers(
        "https://www.nsw.gov.au/visas-and-migration/skilled-visas/nsw-skills-lists",
      ),
    ).toContainEqual({
      file: "scripts/state-lists/nsw.ts",
      item: "NSW_LIST_URL",
      checkedAt: "2026-11-18",
    });
    // a state rule and a fee
    const listCiters = citers(OCCUPATION_LIST).map((c) => c.file);
    expect(listCiters).toContain("src/data/guide/sources.ts");
    expect(listCiters).toContain("scripts/state-lists/federal.ts");
    expect(
      citers("https://www.acs.org.au/msa/infohub/fees-and-payment.html"),
    ).toContainEqual({
      file: "src/data/guide/third-party-fees.ts",
      item: "assessingBodies › acs",
      checkedAt: "2026-11-23",
    });
    expect(
      sources.some((s) =>
        s.citedBy.some((c) => c.file === "src/data/state-rules/2026-27/act.ts"),
      ),
    ).toBe(true);
  });
});

describe("findCitations", () => {
  it("finds https source and url strings with the nearest checkedAt", () => {
    const value = {
      rules: [
        {
          id: "a",
          status: {
            value: "open",
            source: "https://a.gov.au/x",
            checkedAt: "2026-11-17",
          },
          system: {
            value: { url: "https://a.gov.au/y" },
            source: "not a url",
            checkedAt: "2026-11-01",
          },
        },
        { source: "http://insecure.example/z" },
      ],
    };
    expect(findCitations(value, "f.ts")).toEqual([
      {
        url: "https://a.gov.au/x",
        file: "f.ts",
        item: "rules › a › status",
        checkedAt: "2026-11-17",
      },
      {
        url: "https://a.gov.au/y",
        file: "f.ts",
        item: "rules › a › system › value",
        checkedAt: "2026-11-01",
      },
    ]);
  });

  it("keeps a null checkedAt when none is near", () => {
    expect(findCitations([{ url: "https://b.gov.au/" }], "g.ts")).toEqual([
      { url: "https://b.gov.au/", file: "g.ts", item: "[0]", checkedAt: null },
    ]);
  });
});

describe("groupByUrl", () => {
  it("fetches a page once for all its anchors", () => {
    expect(
      groupByUrl([
        {
          url: "https://d.gov.au/p#a",
          file: "i.ts",
          item: "x",
          checkedAt: null,
        },
        { url: "https://d.gov.au/p", file: "i.ts", item: "y", checkedAt: null },
      ]),
    ).toEqual([
      {
        url: "https://d.gov.au/p",
        citedBy: [
          { file: "i.ts", item: "x (#a)", checkedAt: null },
          { file: "i.ts", item: "y", checkedAt: null },
        ],
      },
    ]);
  });

  it("drops a repeated citing item", () => {
    const citation = {
      url: "https://c.gov.au/",
      file: "h.ts",
      item: "x",
      checkedAt: null,
    };
    expect(groupByUrl([citation, citation])).toEqual([
      {
        url: "https://c.gov.au/",
        citedBy: [{ file: "h.ts", item: "x", checkedAt: null }],
      },
    ]);
  });
});
