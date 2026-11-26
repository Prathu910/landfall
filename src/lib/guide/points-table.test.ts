import { describe, expect, it } from "vitest";
import { POINTS_TABLE } from "../../data/guide/points-table";
import { BANNED_COPY } from "../report/copy";
import {
  POINTS_TABLE_PAGE,
  pointsInBrief,
  pointsTableAnswer,
  pointsTableFaq,
  pointsTableJsonLd,
} from "./points-table";

const round = {
  date: "2026-10-15",
  invited: 20000,
  occupations: 159,
  lowest: 65,
  highest: 100,
  atLowest: 44,
  month: "2026-10" as const,
};

describe("the points table page", () => {
  it("opens with a dated, sourced answer built from the table", () => {
    expect(pointsTableAnswer(POINTS_TABLE)).toBe(
      "As at 23 Nov 2026, the Australian points test for the 189, 190 and 491 has a pass mark of 65 points. Age gives up to 30 points (25 to 32), English up to 20 (Superior), skilled employment up to 20 combined and qualifications up to 20 (a doctorate); state nomination adds 5 for the 190 or 15 for the 491. Source: Home Affairs points table, checked 23 Nov 2026.",
    );
  });
  it("quotes the latest 189 round in the pass-mark answer only when there is one", () => {
    const [withRound] = pointsTableFaq(POINTS_TABLE, round);
    expect(withRound.answer).toContain("In the 15 Oct 2026 189 round");
    const [withoutRound] = pointsTableFaq(POINTS_TABLE, null);
    expect(withoutRound.answer).not.toContain("round");
  });
  it("follows the copy rules", () => {
    const text = [
      pointsTableAnswer(POINTS_TABLE),
      ...pointsTableFaq(POINTS_TABLE, round).flatMap((f) => [
        f.question,
        f.answer,
      ]),
      ...POINTS_TABLE.flatMap((f) => [
        f.factor,
        f.question,
        f.note,
        ...f.rows.map((r) => r.band),
      ]),
      POINTS_TABLE_PAGE.title,
      POINTS_TABLE_PAGE.description,
    ];
    for (const line of text) {
      expect(line).not.toMatch(BANNED_COPY);
      expect(line).not.toMatch(/%|\bchances?\b|\bguarantee/i);
    }
  });
  it("fits its title and description and marks the page up as an article in the guide", () => {
    expect(
      (POINTS_TABLE_PAGE.title + " · MigrateLens").length,
    ).toBeLessThanOrEqual(60);
    expect(POINTS_TABLE_PAGE.description.length).toBeGreaterThanOrEqual(120);
    expect(POINTS_TABLE_PAGE.description.length).toBeLessThanOrEqual(160);
    const ld = pointsTableJsonLd([], "2026-11-23", ["https://x.gov.au/"]);
    expect(ld.map((o) => (o as { "@type": string })["@type"])).toEqual([
      "Article",
      "FAQPage",
      "BreadcrumbList",
    ]);
    expect(JSON.stringify(ld[2])).toContain("/guide/points-table/");
  });
  it("sums each factor up in one line for the /check/ explainer", () => {
    expect(pointsInBrief(POINTS_TABLE)).toEqual([
      { factor: "Age", points: "Up to 30" },
      { factor: "English", points: "Up to 20" },
      { factor: "Skilled employment", points: "Up to 20 combined" },
      {
        factor: "Qualifications",
        points: "Up to 20, plus 10 for specialist education",
      },
      {
        factor:
          "Australian study, regional study, Professional Year, NAATI CCL",
        points: "5 each",
      },
      { factor: "Partner", points: "Up to 10" },
      { factor: "Nomination", points: "5 (190) or 15 (491)" },
    ]);
  });
});
