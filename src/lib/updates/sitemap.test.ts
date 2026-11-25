import { describe, expect, it } from "vitest";
import { SITE_URL } from "../site";
import { dataOnly, roundOnly } from "./__fixtures__/recap-facts";
import { loadRecap } from "./load-server";
import { updatesSitemapEntries } from "./sitemap";

const oct = loadRecap("2026-10");

describe("updatesSitemapEntries", () => {
  it("dates the index and October 2026 by its last update", () => {
    expect(updatesSitemapEntries([oct])).toEqual([
      { url: `${SITE_URL}/updates/`, lastModified: "2026-11-24" },
      { url: `${SITE_URL}/updates/2026-10/`, lastModified: "2026-11-24" },
    ]);
  });

  it("includes a round-only recap and dates the index by the newest update", () => {
    const entries = updatesSitemapEntries([oct, roundOnly, dataOnly]);
    expect(entries).toContainEqual({
      url: `${SITE_URL}/updates/2026-11/`,
      lastModified: "2026-11-20",
    });
    expect(entries[0]).toEqual({
      url: `${SITE_URL}/updates/`,
      lastModified: "2027-01-18",
    });
    expect(entries).toHaveLength(4);
  });

  it("lists nothing when there are no recaps", () => {
    expect(updatesSitemapEntries([])).toEqual([]);
  });
});
