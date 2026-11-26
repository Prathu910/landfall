import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { SITE_URL } from "../site";
import { dataOnly, roundOnly, twoRounds } from "./__fixtures__/recap-facts";
import {
  buildUpdatesIndex,
  UPDATES_INDEX_INTRO,
  UPDATES_INDEX_TITLE,
  updatesIndexDescription,
  updatesIndexJsonLd,
} from "./index-view";
import { loadRecap } from "./load-server";

const oct = loadRecap("2026-10");

describe("buildUpdatesIndex, October 2026 only", () => {
  const view = buildUpdatesIndex([oct]);

  it("dates the answer by the data month", () => {
    expect(view.answer).toBe(
      "The latest update covers SkillSelect data as at 31 October 2026.",
    );
  });

  it("leads with October's stamp, headline and three figures", () => {
    expect(view.latest.path).toBe("/updates/2026-10/");
    expect(view.latest.month).toBe("October 2026");
    expect(view.latest.headline).toBe(
      "SkillSelect October 2026: 20,000 EOIs invited in the 189 round",
    );
    expect(view.latest.stamp.text).toBe(
      "SUBCLASS 189 ROUND · 20,000 INVITED · 15 OCT 2026",
    );
    expect(view.latest.figures).toHaveLength(3);
    expect(view.latest.figures.map((f) => f.value)).toEqual([
      "159",
      "65–100",
      "about 167,000",
    ]);
  });

  it("lists the month with its round date", () => {
    expect(view.months).toEqual([
      {
        month: "October 2026",
        path: "/updates/2026-10/",
        headline:
          "SkillSelect October 2026: 20,000 EOIs invited in the 189 round",
        roundDate: "2026-10-15",
        roundText: "189 round 15 Oct 2026",
      },
    ]);
  });
});

describe("buildUpdatesIndex, a round-only newest month", () => {
  const view = buildUpdatesIndex([oct, roundOnly]);

  it("dates the answer by the newest round while its data isn't out", () => {
    expect(view.answer).toBe(
      "The latest update covers the 189 invitation round on 19 November 2026.",
    );
    expect(view.latest.path).toBe("/updates/2026-11/");
    expect(view.latest.figures.length).toBeLessThanOrEqual(3);
    expect(view.latest.figures.map((f) => f.label).join(" ")).not.toMatch(
      /pool/,
    );
  });
});

describe("buildUpdatesIndex, several months", () => {
  // Given out of order: the view sorts newest first itself.
  const view = buildUpdatesIndex([oct, dataOnly, roundOnly]);

  it("dates the answer by the newest month's data", () => {
    expect(view.answer).toBe(
      "The latest update covers SkillSelect data as at 31 December 2026.",
    );
  });

  it("orders every month newest first", () => {
    expect(view.months.map((m) => m.path)).toEqual([
      "/updates/2026-12/",
      "/updates/2026-11/",
      "/updates/2026-10/",
    ]);
  });

  it("gives a month without a round no round date", () => {
    expect(view.months[0]).toMatchObject({
      headline: "SkillSelect December 2026: 190 and 491 invitations by state",
      roundDate: null,
      roundText: "No 189 round",
    });
    expect(view.months[1].roundDate).toBe("2026-11-19");
  });

  it("refuses an empty list", () => {
    expect(() => buildUpdatesIndex([])).toThrow(/No recap/);
  });
});

describe("updatesIndexJsonLd", () => {
  const ld = updatesIndexJsonLd(buildUpdatesIndex([roundOnly, oct])) as {
    "@type": string;
    url?: string;
    mainEntity?: { itemListElement: { position: number; url: string }[] };
    itemListElement?: { name: string; item: string }[];
  }[];

  it("is a CollectionPage listing every recap, then the breadcrumb", () => {
    expect(ld.map((o) => o["@type"])).toEqual([
      "CollectionPage",
      "BreadcrumbList",
    ]);
    expect(ld[0].url).toBe(`${SITE_URL}/updates/`);
    expect(ld[0].mainEntity?.itemListElement).toEqual([
      expect.objectContaining({
        position: 1,
        url: `${SITE_URL}/updates/2026-11/`,
      }),
      expect.objectContaining({
        position: 2,
        url: `${SITE_URL}/updates/2026-10/`,
      }),
    ]);
    expect(ld[1].itemListElement?.map((c) => c.item)).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/updates/`,
    ]);
  });
});

describe("the index's copy", () => {
  it("passes the banned-copy rule and keeps the description short", () => {
    for (const recaps of [[oct], [oct, roundOnly], [twoRounds, dataOnly]]) {
      const view = buildUpdatesIndex(recaps);
      const description = updatesIndexDescription(view);
      const strings = [
        JSON.stringify(view),
        JSON.stringify(updatesIndexJsonLd(view)),
        description,
        UPDATES_INDEX_TITLE,
        UPDATES_INDEX_INTRO,
      ];
      expect(strings.filter((s) => BANNED_COPY.test(s))).toEqual([]);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description).not.toContain("…");
    }
  });
});
