import { describe, expect, it } from "vitest";
import { occupationIndex } from "../../components/data/occupation-index";
import { stateRuleData } from "../../components/data/state-rule-data";
import { loadOccupationCore } from "../data/load-server";
import { allMaskedCore } from "../report/__fixtures__/scorecard";
import { SITE_URL } from "../site";
import { occupationFaq } from "./faq";
import {
  isIndexable,
  occupationJsonLd,
  pageDescription,
  pageTitle,
  relatedOccupations,
  sitemapEntries,
} from "./meta";
import { occupationPath } from "./slug";
import { stateRows } from "./states";
import { occupationSummary } from "./summary";

const core = loadOccupationCore("261313")!;
const faq = occupationFaq(core, stateRows("261313", core, stateRuleData));
const summary = occupationSummary(core, null);
// allMaskedCore masks only its monthly history; its pools are unmasked.
const maskedPools = {
  total: "<20",
  byScore: { "90": "<20", "95": "<20" },
};
const maskedCore = {
  ...allMaskedCore,
  code: "261312",
  name: "Developer Programmer",
  pool: { "189": maskedPools, "190": maskedPools, "491": maskedPools },
};

describe("relatedOccupations", () => {
  it("shares the first four digits and excludes itself", () => {
    const related = relatedOccupations("261313", occupationIndex);
    expect(related.length).toBeLessThanOrEqual(6);
    expect(related.every((r) => r.code.startsWith("2613"))).toBe(true);
    expect(related.map((r) => r.code)).not.toContain("261313");
    expect(related.map((r) => r.code)).toContain("261312");
    expect(related[0].path).toMatch(/^\/occupations\/.+\/$/);
  });
});

describe("isIndexable", () => {
  it("is false when every count is under 20", () => {
    expect(isIndexable(core)).toBe(true);
    expect(isIndexable(maskedCore)).toBe(false);
    expect(isIndexable({ ...core, pool: {} })).toBe(false);
  });
});

describe("pageTitle and pageDescription", () => {
  it("builds the title", () => {
    expect(pageTitle(core)).toBe(
      "Software Engineer (261313): 189, 190 and 491 EOIs and cut-offs, Oct 2026",
    );
  });
  it("trims at a word boundary only when needed", () => {
    expect(pageDescription(["Short one.", "Two."])).toBe("Short one. Two.");
    const long = pageDescription(["word ".repeat(60).trim()]);
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("word…")).toBe(true);
  });
});

describe("occupationJsonLd", () => {
  const ld = occupationJsonLd(core, faq, summary, "2026-11-17") as Record<
    string,
    unknown
  >[];
  it("returns Dataset, FAQPage and BreadcrumbList", () => {
    expect(ld.map((o) => o["@type"])).toEqual([
      "Dataset",
      "FAQPage",
      "BreadcrumbList",
    ]);
    expect(ld[0].license).toBe(
      "https://creativecommons.org/licenses/by/3.0/au/",
    );
    expect(JSON.stringify(ld[0].creator)).toContain(
      "Department of Home Affairs",
    );
  });
  it("states the coverage and that the data is free", () => {
    expect(ld[0].temporalCoverage).toBe("2023-11/2026-10");
    expect(ld[0].isAccessibleForFree).toBe(true);
  });
  it("uses absolute site URLs", () => {
    const urls = JSON.stringify(ld).match(/"(?:url|item)":"([^"]+)"/g)!;
    for (const u of urls) expect(u).toContain(`"${SITE_URL}`);
  });
});

describe("sitemapEntries", () => {
  const entries = sitemapEntries(
    [core, maskedCore],
    occupationIndex,
    "2026-11-17",
  );
  const urls = entries.map((e) => e.url);
  it("lists indexable pages only", () => {
    expect(urls).toContain(`${SITE_URL}/occupations/`);
    expect(urls).toContain(SITE_URL + occupationPath(core));
    expect(urls).not.toContain(SITE_URL + occupationPath(maskedCore));
  });
  it("ends every URL in a slash and dates it", () => {
    for (const e of entries) {
      expect(e.url.endsWith("/")).toBe(true);
      expect(e.lastModified).toBe("2026-11-17");
    }
  });
});
