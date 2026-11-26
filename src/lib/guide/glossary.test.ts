import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import {
  GLOSSARY_PAGE,
  METHOD_TERM_IDS,
  glossaryJsonLd,
  glossaryTerms,
} from "./glossary";

const terms = glossaryTerms({
  dashboard: "https://example.gov.au/dashboard",
  currentRounds: "https://immi.homeaffairs.gov.au/rounds",
});

describe("the glossary", () => {
  it("has the terms the audit lists, each with a unique anchor", () => {
    const ids = terms.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [
      "eoi",
      "invitation-round",
      "tie-break-date",
      "masked-count",
      "skillselect",
      "anzsco-code",
      "nomination-points",
      "roi",
      "visa-191",
      "invited",
      "lodged",
      "hold",
      "closed",
      "skills-assessment",
      "cut-off",
      ...METHOD_TERM_IDS,
    ]) {
      expect(ids).toContain(id);
    }
  });
  it("defines each term in one sentence that can be quoted alone", () => {
    for (const t of terms) {
      expect(t.definition.match(/[.!?](\s|$)/g), t.id).toHaveLength(1);
      expect(t.definition).not.toMatch(/^(It|This|They|These)\b/);
      expect(t.definition).not.toMatch(BANNED_COPY);
      expect(t.source.href).toMatch(/^(https:\/\/|\/)/);
    }
  });
  it("keeps a masked count a range that may be zero, and nomination points from the table", () => {
    const masked = terms.find((t) => t.id === "masked-count");
    expect(masked?.definition).toContain("range of 0 to 19, which may be zero");
    const nomination = terms.find((t) => t.id === "nomination-points");
    expect(nomination?.definition).toContain("5 points a 190");
    expect(nomination?.definition).toContain("15 points a 491");
  });
  it("sorts A to Z and marks the page up as a DefinedTermSet", () => {
    const names = terms.map((t) => t.term);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    const [set, crumbs] = glossaryJsonLd(terms) as Record<string, unknown>[];
    expect(set["@type"]).toBe("DefinedTermSet");
    const defined = set.hasDefinedTerm as { "@id": string }[];
    expect(defined).toHaveLength(terms.length);
    expect(defined[0]["@id"]).toMatch(
      /^https:\/\/migratelens\.com\/guide\/glossary\/#/,
    );
    expect(crumbs["@type"]).toBe("BreadcrumbList");
  });
  it("fits its title and description", () => {
    expect((GLOSSARY_PAGE.title + " · MigrateLens").length).toBeLessThanOrEqual(
      60,
    );
    expect(GLOSSARY_PAGE.description.length).toBeGreaterThanOrEqual(120);
    expect(GLOSSARY_PAGE.description.length).toBeLessThanOrEqual(160);
  });
});
