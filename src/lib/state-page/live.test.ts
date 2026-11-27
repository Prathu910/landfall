import { describe, expect, it } from "vitest";
import { listRecapMonths, loadRecap } from "../updates/load-server";
import { loadStatePageViews } from "./load-server";
import { STATE_VISAS } from "./program";

/**
 * The state pages and the monthly recap read the same month: their latest
 * floors and hidden counts must agree, so the two pages never disagree.
 */
describe("state pages against the recap of their month", () => {
  const views = loadStatePageViews();
  const asAt = views[0].facts.asAt;
  const recap = listRecapMonths().includes(asAt) ? loadRecap(asAt) : null;

  it.runIf(recap?.data)("match the recap's state figures", () => {
    const states = recap?.data?.states;
    for (const view of views) {
      for (const visa of STATE_VISAS) {
        const figure = states?.[visa][view.page.code];
        const latest = view.facts.visas[visa].latest;
        expect(latest?.total.min, `${view.page.code} ${visa}`).toBe(
          figure?.floor,
        );
        expect(latest?.maskedCells, `${view.page.code} ${visa}`).toBe(
          figure?.maskedCells,
        );
      }
    }
  });
});
