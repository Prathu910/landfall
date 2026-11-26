import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { frozenCore, frozenIndex } from "../data/__fixtures__/frozen-2026-10";
import { allMaskedCore } from "../report/__fixtures__/scorecard";
import { SITE_URL } from "../site";
import { occupationFaq } from "./faq";
import {
  datasetName,
  isIndexable,
  occupationJsonLd,
  occupationRobots,
  pageDescription,
  pageTitle,
  relatedOccupations,
  sitemapEntries,
} from "./meta";
import { occupationPath } from "./slug";
import { stateRows } from "./states";
import { occupationSummary } from "./summary";

const core = frozenCore("261313")!;
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
    const related = relatedOccupations("261313", frozenIndex());
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
  it("leads with the name and keeps the brand when it fits", () => {
    expect(pageTitle(core)).toBe(
      "Software Engineer: 189 cut-offs and EOI pools · MigrateLens",
    );
    expect(pageTitle({ ...core, name: "Chef" })).toBe(
      "Chef: 189, 190 and 491 EOIs and cut-offs · MigrateLens",
    );
  });
  it("falls back to the bare name when nothing else fits", () => {
    const long = "Architectural, Building and Surveying Technicians nec";
    expect(pageTitle({ ...core, name: long })).toBe(long);
  });
  it("keeps whole sentences and tops up short ones", () => {
    const text = pageDescription(core, ["Short one."]);
    expect(text.startsWith("Short one. ANZSCO 261313, from SkillSelect")).toBe(
      true,
    );
    expect(text.length).toBeGreaterThanOrEqual(120);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).not.toContain("…");
  });
});

describe("occupationRobots", () => {
  it("keeps links followed on a noindex page", () => {
    expect(occupationRobots(true, true)).toBeUndefined();
    expect(occupationRobots(true, false)).toEqual({
      index: false,
      follow: true,
    });
    expect(occupationRobots(false, true)).toEqual({
      index: false,
      follow: false,
    });
  });
});

describe("occupationJsonLd", () => {
  const sources = ["https://example.gov.au/dashboard"];
  const ld = occupationJsonLd(
    core,
    faq,
    summary,
    "2026-11-17",
    sources,
  ) as Record<string, unknown>[];
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
  it("uses absolute site URLs for the page and its breadcrumbs", () => {
    expect(ld[0].url).toBe(SITE_URL + occupationPath(core));
    const items = JSON.stringify(ld[2]).match(/"item":"([^"]+)"/g)!;
    for (const u of items) expect(u).toContain(`"${SITE_URL}`);
  });
  it("describes the dataset for Dataset Search", () => {
    expect(ld[0]).toMatchObject({
      identifier: "ANZSCO 261313",
      version: core.snapshotId,
      description: summary.join(" "),
      isBasedOn: sources,
      spatialCoverage: { "@type": "Place", name: "Australia" },
      creator: {
        "@type": "GovernmentOrganization",
        name: "Department of Home Affairs",
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
      includedInDataCatalog: { url: `${SITE_URL}/occupations/` },
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${SITE_URL}/data/occupations/261313.json`,
        },
      ],
    });
    expect((ld[0].variableMeasured as string[]).length).toBeGreaterThan(0);
    expect(String(ld[0].description)).not.toContain("…");
  });
});

describe("sitemapEntries", () => {
  const entries = sitemapEntries(
    [core, maskedCore],
    frozenIndex(),
    "2026-11-17",
    "2026-11-23",
  );
  const guide = [
    "/guide/",
    "/guide/189/",
    "/guide/190/",
    "/guide/491/",
    "/guide/points-table/",
  ];
  const urls = entries.map((e) => e.url);
  it("lists indexable pages only", () => {
    expect(urls).toContain(`${SITE_URL}/occupations/`);
    expect(urls).toContain(`${SITE_URL}/check/`);
    expect(urls).toContain(`${SITE_URL}/about/`);
    expect(urls).toContain(SITE_URL + occupationPath(core));
    expect(urls).not.toContain(SITE_URL + occupationPath(maskedCore));
  });
  it("dates a dropped occupation's sitemap entry by lastCheckedAt and keeps it listed", () => {
    const marked = frozenIndex().map((e) =>
      e.code === core.code
        ? { ...e, lastAsAt: "2026-09", lastCheckedAt: "2026-10-20" }
        : e,
    );
    const dropped = sitemapEntries(
      [core],
      marked,
      "2026-11-17",
      "2026-11-23",
    ).find((e) => e.url === SITE_URL + occupationPath(core));
    expect(dropped?.lastModified).toBe("2026-10-20");
  });
  it("lists the PR guide, its three visa pages and its reference pages", () => {
    for (const path of guide) {
      expect(urls).toContain(SITE_URL + path);
    }
  });
  it("ends every URL in a slash and dates it", () => {
    for (const e of entries) {
      expect(e.url.endsWith("/")).toBe(true);
      const isGuide = guide.some((path) => e.url === SITE_URL + path);
      expect(e.lastModified).toBe(isGuide ? "2026-11-23" : "2026-11-17");
    }
  });
  it("dates the guide pages by the day their sources were checked", () => {
    const dated = entries.filter((e) =>
      guide.some((path) => e.url === SITE_URL + path),
    );
    expect(dated.map((e) => e.lastModified)).toEqual(
      Array(guide.length).fill("2026-11-23"),
    );
  });
});

describe("a dropped occupation's own snapshot", () => {
  const old = {
    ...core,
    asAt: "2026-09",
    snapshotId: "skillselect-2026-09-30",
  };
  it("takes its title and coverage from its core, not the current month", () => {
    expect(datasetName(old)).toMatch(/Sep 2026$/);
    const dataset = occupationJsonLd(
      old,
      faq,
      summary,
      "2026-10-20",
      [],
    )[0] as {
      temporalCoverage: string;
      dateModified: string;
    };
    expect(dataset.temporalCoverage.endsWith("/2026-09")).toBe(true);
    expect(dataset.dateModified).toBe("2026-10-20");
  });
});
