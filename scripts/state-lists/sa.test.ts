// Fixture captured 2026-11-18 from the SA skilled occupation list page,
// trimmed to 16 of its 353 occupation blocks (the eleven original
// occupations and five that test odd cases), kept as the site wrote them.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isImportedList } from "../../src/lib/state-outlook/rules-guards";
import { buildSaList, parseSaPage } from "./sa";

const page = readFileSync(
  new URL("./__fixtures__/sa.html", import.meta.url),
  "utf8",
);

type Block = { location: string; stream: string; subclasses: string[] };

/** One occupation block in the markup shape the site uses. */
function occupation(code: string, blocks: Block[], title = `Job ${code}`) {
  const body = blocks
    .map(
      (b) =>
        `<div><p class="x">Applying from</p><div class="mb-4 uppercase">${b.location}</div></div>` +
        `<div><p class="x">Stream</p><div>${b.stream}</div></div>` +
        `<p class="x">Subclass</p><div class="mb-8">${b.subclasses
          .map(
            (s) =>
              `<a href="https://immi.homeaffairs.gov.au/visa-listing">${s}</a>`,
          )
          .join("")}</div><p class="x">Skill Level</p>`,
    )
    .join("");
  return `<div data-occupation-id=001-1 data-occupation-category-id=001 data-occupation-anzsco=${code} data-occupation-title="${title}">${body}</div>`;
}

const GRAD: Block = {
  location: "South Australia",
  stream: "South Australian Graduates",
  subclasses: ["190", "491"],
};
const OFFSHORE: Block = {
  location: "Offshore",
  stream: "Offshore",
  subclasses: ["190", "491"],
};

describe("parseSaPage", () => {
  const { entries } = parseSaPage(page);

  it("lists Accountant (General) for 491 onshore only", () => {
    expect(entries["221111"]).toEqual({
      "491": ["living-in-state"],
      streams: {
        "491": [
          "South Australian Graduates",
          "Skilled Employment in South Australia",
          "Outer Regional Skilled Employment",
        ],
      },
    });
  });

  it("lists Software Engineer for 190 and 491 onshore only", () => {
    expect(entries["261313"]["190"]).toEqual(["living-in-state"]);
    expect(entries["261313"]["491"]).toEqual(["living-in-state"]);
  });

  it("adds the offshore cohort where the offshore stream lists the visa", () => {
    expect(entries["233211"]["190"]).toEqual(["living-in-state", "offshore"]);
    expect(entries["233211"]["491"]).toEqual(["living-in-state", "offshore"]);
    expect(entries["233211"].streams?.["190"]).toContain("Offshore");
    expect(entries["233211"].streams?.["491"]).toContain("Offshore");
  });

  it("lists Chef for 491 only, without the Graduates stream", () => {
    expect(entries["351311"]["190"]).toBeUndefined();
    expect(entries["351311"]["491"]).toEqual(["living-in-state"]);
    expect(entries["351311"].streams).toEqual({
      "491": [
        "Skilled Employment in South Australia",
        "Outer Regional Skilled Employment",
      ],
    });
  });

  it("never lists living-in-other-state", () => {
    for (const entry of Object.values(entries)) {
      expect(entry["190"] ?? []).not.toContain("living-in-other-state");
      expect(entry["491"] ?? []).not.toContain("living-in-other-state");
    }
  });

  it("unions the cohorts of a code listed under two titles", () => {
    // Medical Physicist is 491 only offshore; Physicist (non-medical) has both.
    expect(entries["234914"]["190"]).toEqual(["living-in-state", "offshore"]);
    expect(entries["234914"]["491"]).toEqual(["living-in-state", "offshore"]);
  });

  it("names the titles a repeated code was listed under, per visa", () => {
    const titles = [
      "title:Physicist (Medical Physicist Only)",
      "title:Physicist (non-medical)",
    ];
    const streams = entries["234914"].streams;
    expect(streams?.["190"]).toEqual(expect.arrayContaining(titles));
    expect(streams?.["491"]).toEqual(expect.arrayContaining(titles));
    const single = entries["261313"].streams?.["190"] ?? [];
    expect(single.some((s) => s.startsWith("title:"))).toBe(false);
  });

  it("names a title only under the visas its blocks list", () => {
    const html =
      occupation("234914", [{ ...GRAD, subclasses: ["491"] }], "Medical") +
      occupation("234914", [GRAD], "Other");
    expect(parseSaPage(html).entries["234914"].streams).toEqual({
      "190": ["South Australian Graduates", "title:Other"],
      "491": ["South Australian Graduates", "title:Medical", "title:Other"],
    });
  });

  it("does not tag a visa with a stream that does not list it", () => {
    const html = occupation("261313", [
      { ...GRAD, subclasses: ["491"] },
      { ...OFFSHORE, subclasses: ["190"] },
    ]);
    expect(parseSaPage(html).entries["261313"].streams).toEqual({
      "190": ["Offshore"],
      "491": ["South Australian Graduates"],
    });
  });

  it("maps an Any Location block to the cohorts the other blocks give", () => {
    expect(entries["232214"]["190"]).toEqual(["living-in-state", "offshore"]);
    expect(entries["232214"]["491"]).toEqual(["living-in-state", "offshore"]);
  });

  it("gives a visa listed only under Any Location the other blocks' cohorts", () => {
    const html = occupation("261313", [
      { ...GRAD, subclasses: ["491"] },
      {
        location: "Any Location",
        stream: "Outer Regional Skilled Employment",
        subclasses: ["190"],
      },
    ]);
    expect(parseSaPage(html).entries["261313"]["190"]).toEqual([
      "living-in-state",
    ]);
  });

  it("throws when a code appears only under Any Location", () => {
    const html = occupation("261313", [
      {
        location: "Any Location",
        stream: "Outer Regional Skilled Employment",
        subclasses: ["190", "491"],
      },
    ]);
    expect(() => parseSaPage(html)).toThrow(/261313.*only under Any Location/);
  });

  it("throws when the other blocks list neither visa", () => {
    const html = occupation("261313", [
      { ...GRAD, subclasses: [] },
      {
        location: "Any Location",
        stream: "Outer Regional Skilled Employment",
        subclasses: ["190"],
      },
    ]);
    expect(() => parseSaPage(html)).toThrow(/only under Any Location/);
  });

  it("reports the repeated codes", () => {
    expect(parseSaPage(page).repeated.sort()).toEqual(["234914", "242211"]);
  });

  it("omits an occupation no stream offers for either visa", () => {
    const html = occupation("261313", [
      { ...GRAD, subclasses: [] },
      { ...OFFSHORE, subclasses: [] },
    ]);
    expect(parseSaPage(html).entries["261313"]).toBeUndefined();
  });

  it("throws when the page has no occupation blocks", () => {
    expect(() => parseSaPage("<html></html>")).toThrow(/review/);
  });

  it("throws on an unknown stream", () => {
    const html = occupation("261313", [{ ...GRAD, stream: "New Stream" }]);
    expect(() => parseSaPage(html)).toThrow(/New Stream/);
  });

  it("throws on an unknown applying-from location", () => {
    const html = occupation("261313", [{ ...GRAD, location: "Mars" }]);
    expect(() => parseSaPage(html)).toThrow(/Mars/);
  });

  it("throws on an unknown subclass", () => {
    const html = occupation("261313", [{ ...GRAD, subclasses: ["189"] }]);
    expect(() => parseSaPage(html)).toThrow(/189/);
  });

  it("throws on a block with no applying-from sections", () => {
    const html = `<div data-occupation-id=001-1 data-occupation-category-id=001 data-occupation-anzsco=261313 data-occupation-title="Job"></div>`;
    expect(() => parseSaPage(html)).toThrow(/261313/);
  });

  it("throws on a block whose header cannot be read", () => {
    expect(() => parseSaPage("<div data-occupation-id=001-1></div>")).toThrow(
      /review/,
    );
  });
});

describe("buildSaList", () => {
  const meta = { source: "https://example.gov.au/sa", checkedAt: "2026-11-18" };

  it("returns a guard-valid list with sorted codes", () => {
    const { list } = buildSaList(page, meta);
    expect(isImportedList(list)).toBe(true);
    expect(list.listId).toBe("sa");
    const codes = Object.keys(list.entries);
    expect(codes).toEqual([...codes].sort());
  });
});
