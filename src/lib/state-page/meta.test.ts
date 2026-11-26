import { describe, expect, it } from "vitest";
import { TITLE_MAX } from "../seo/title";
import { frozenStateViews, frozenView } from "./__fixtures__/frozen-views";
import {
  isStateIndexable,
  stateDescription,
  stateJsonLd,
  stateSitemapEntries,
  stateTitle,
} from "./meta";
import type { StatePageView } from "./view";

const views = [...frozenStateViews().values()];

describe("state page metadata (frozen 2026-10)", () => {
  it("fits every title in 60 characters, unique per state", () => {
    const titles = views.map(stateTitle);
    for (const title of titles)
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(new Set(titles).size).toBe(8);
    expect(stateTitle(frozenView("NSW"))).toBe(
      "NSW 190 & 491 invitations and points, Oct 2026 · MigrateLens",
    );
  });

  it("writes unique whole-sentence descriptions of 120 to 160 characters", () => {
    const descriptions = views.map(stateDescription);
    for (const d of descriptions) {
      expect(d.length).toBeGreaterThanOrEqual(120);
      expect(d.length).toBeLessThanOrEqual(160);
      expect(d).toMatch(/\.$/);
      expect(d).not.toContain("…");
    }
    expect(new Set(descriptions).size).toBe(8);
  });

  it("emits BreadcrumbList, FAQPage, a state Dataset and an Article", () => {
    const ld = stateJsonLd(frozenView("TAS")) as Record<string, unknown>[];
    expect(ld.map((node) => node["@type"])).toEqual([
      "BreadcrumbList",
      "FAQPage",
      "Dataset",
      "Article",
    ]);
    expect(ld[2].spatialCoverage).toEqual({
      "@type": "AdministrativeArea",
      name: "Tasmania",
      containedInPlace: { "@type": "Country", name: "Australia" },
    });
    expect(ld[2].temporalCoverage).toBe("2025-11/2026-10");
  });

  it("indexes every state with a published count, and none without", () => {
    for (const view of views) expect(isStateIndexable(view)).toBe(true);
    const tas = frozenView("TAS");
    const empty = (visa: "190" | "491") => ({
      ...tas.facts.visas[visa],
      pool: { min: 0, max: 19 },
      series: {
        ...tas.facts.visas[visa].series,
        months: tas.facts.visas[visa].series.months.map((m) => ({
          month: m.month,
          figure: { total: { min: 0, max: 19 }, maskedCells: 1 },
        })),
      },
    });
    const hidden: StatePageView = {
      ...tas,
      facts: {
        ...tas.facts,
        visas: { "190": empty("190"), "491": empty("491") },
      },
    };
    expect(isStateIndexable(hidden)).toBe(false);
    expect(stateSitemapEntries([hidden, frozenView("NSW")])).toHaveLength(1);
  });

  it("lists indexable states in the sitemap with dated, trailing-slash URLs", () => {
    const entries = stateSitemapEntries(views);
    expect(entries).toHaveLength(8);
    for (const entry of entries) {
      expect(entry.url).toMatch(
        /^https:\/\/migratelens\.com\/states\/[a-z-]+\/$/,
      );
      expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
