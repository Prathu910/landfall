import { describe, expect, it } from "vitest";
import { SITE_URL } from "../site";
import { pagesFor } from "./__fixtures__/occupation-pages";
import { dataOnly, roundOnly } from "./__fixtures__/recap-facts";
import { loadRecap } from "./load-server";
import { recapDescription, recapJsonLd, recapTitle } from "./meta";
import { buildRecapView } from "./recap-view";

const oct = loadRecap("2026-10");
const ctx = {
  recapMonths: ["2026-10"],
  occupationPages: pagesFor(oct, dataOnly, roundOnly),
};
const OG = "/social/2026-10/og.png";

type Ld = Record<string, unknown>;

describe("recapTitle", () => {
  it("names the round and the states, or the states alone", () => {
    expect(recapTitle(oct)).toBe(
      "SkillSelect October 2026 update: 189 round, 190 and 491 by state | MigrateLens",
    );
    expect(recapTitle(dataOnly)).toBe(
      "SkillSelect December 2026 update: 190 and 491 invitations by state | MigrateLens",
    );
  });
});

describe("recapDescription", () => {
  it("cuts the direct answer at a word boundary", () => {
    const view = buildRecapView(oct, ctx);
    const description = recapDescription(view);
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description).toMatch(/^As at 31 October 2026: Home Affairs/);
    expect(description.endsWith("…")).toBe(true);
    expect(view.hero.answer.startsWith(description.slice(0, -1))).toBe(true);
  });
});

describe("recapJsonLd", () => {
  const view = buildRecapView(oct, ctx);
  const ld = recapJsonLd(oct, view, OG) as Ld[];

  it("emits Article, Dataset, FAQPage and BreadcrumbList with data", () => {
    expect(ld.map((o) => o["@type"])).toEqual([
      "Article",
      "Dataset",
      "FAQPage",
      "BreadcrumbList",
    ]);
  });

  it("dates the article by its first and last generation", () => {
    expect(ld[0]).toMatchObject({
      headline: view.hero.h1,
      datePublished: "2026-11-24",
      dateModified: "2026-11-24",
      image: `${SITE_URL}${OG}`,
      url: `${SITE_URL}/updates/2026-10/`,
    });
  });

  it("describes the month's data as a Home Affairs dataset", () => {
    expect(ld[1]).toMatchObject({
      temporalCoverage: "2026-10",
      license: "https://creativecommons.org/licenses/by/3.0/au/",
      creator: { "@type": "Organization", name: "Department of Home Affairs" },
    });
  });

  it("breadcrumbs Home › Updates › the month with absolute URLs", () => {
    const crumbs = (ld[3].itemListElement as Ld[]).map((c) => [c.name, c.item]);
    expect(crumbs).toEqual([
      ["Home", `${SITE_URL}/`],
      ["Updates", `${SITE_URL}/updates/`],
      ["October 2026", `${SITE_URL}/updates/2026-10/`],
    ]);
  });

  it("has no Dataset before the month's data arrives", () => {
    const types = (
      recapJsonLd(roundOnly, buildRecapView(roundOnly, ctx), OG) as Ld[]
    ).map((o) => o["@type"]);
    expect(types).toEqual(["Article", "FAQPage", "BreadcrumbList"]);
  });
});
