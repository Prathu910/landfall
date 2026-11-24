import { describe, expect, it } from "vitest";
import { FEES } from "../../data/guide/fees";
import { sourceList } from "./sources-list";

describe("sourceList", () => {
  it("lists each page once, keeping the first label", () => {
    const list = sourceList(
      [
        { label: "Pricing table", href: FEES.visaCharges["189"].main.source },
        { label: "Again", href: FEES.visaCharges["189"].main.source },
      ],
      FEES,
      "2026-11-23",
    );
    const hrefs = list.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(list[0]).toEqual({
      label: "Pricing table",
      href: FEES.visaCharges["189"].main.source,
      checkedAt: "2026-11-23",
    });
  });
  it("names fee sources by the fee they price", () => {
    const list = sourceList([], FEES, "2026-11-23");
    expect(list.map((s) => s.label)).toContain("ACS (ICT occupations)");
  });
});
