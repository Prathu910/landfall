import { describe, expect, it } from "vitest";
import { HEADERS, NURSE, SOFTWARE_ENGINEER } from "./generate-fixture";
import {
  PAGE_READ_BUDGET,
  planFetches,
  poolScores,
  shiftMonth,
} from "./import-plan";
import { VISA_NAMES } from "./qlik-constants";
import { encodeRaw, type RawViewFile } from "./raw-store";
import { VIEWS } from "./views";

const jobs = (plan: ReturnType<typeof planFetches>) =>
  plan.map((job) => `${job.view.id} ${job.month}`);

describe("PAGE_READ_BUDGET", () => {
  it("allows 250 page reads a month and 600 for a backfill (ruling R11)", () => {
    expect(PAGE_READ_BUDGET).toEqual({ monthly: 250, backfill: 600 });
  });
});

describe("shiftMonth", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2024-11", 23)).toBe("2026-10");
  });
});

describe("planFetches", () => {
  const nothingStored = () => false;

  it("fetches every view at asAt, pool-by-score first", () => {
    const plan = planFetches("2026-10", "monthly", nothingStored);
    const atAsAt = plan.filter((job) => job.month === "2026-10");
    expect(atAsAt.map((job) => job.view.id).sort()).toEqual(
      VIEWS.map((view) => view.id).sort(),
    );
    expect(plan[0].view.id).toBe("pool-by-score");
  });

  it("re-fetches the previous month of the revision-checked views in monthly mode", () => {
    const plan = planFetches("2026-01", "monthly", () => true);
    expect(jobs(plan).filter((job) => !job.endsWith("2026-01"))).toEqual([
      "status-history 2025-12",
      "invited-by-score 2025-12",
      "state-invited 2025-12",
    ]);
  });

  it("backfills each multi-month view's window, skipping stored months", () => {
    const stored = (viewId: string, month: string) =>
      viewId === "status-history" && month === "2025-01";
    const plan = jobs(planFetches("2026-10", "backfill", stored));
    const months = (viewId: string) =>
      plan
        .filter((job) => job.startsWith(`${viewId} `))
        .map((job) => job.split(" ")[1]);

    expect(months("status-history")).toHaveLength(23);
    expect(months("status-history")).not.toContain("2025-01");
    expect(months("status-history")[1]).toBe("2024-11");
    expect(months("invited-by-score")).toHaveLength(24);
    expect(months("state-invited")).toHaveLength(12);
    expect(months("state-invited")[1]).toBe("2025-11");
    expect(months("invited-profile")).toHaveLength(12);
    expect(months("cohorts")).toEqual(["2026-10"]);
    expect(plan.every((job) => job.split(" ")[1] <= "2026-10")).toBe(true);
  });

  it("resumes a backfill without re-fetching stored as-at views", () => {
    const stored = (viewId: string, month: string) =>
      month === "2026-10" && viewId !== "cohorts";
    const atAsAt = planFetches("2026-10", "backfill", stored).filter(
      (job) => job.month === "2026-10",
    );
    expect(atAsAt.map((job) => job.view.id)).toEqual(["cohorts"]);
  });
});

describe("poolScores", () => {
  it("lists every score in the pool-by-score file, in numeric order", () => {
    const row = (occupation: string, points: string) => [
      "10/2026",
      VISA_NAMES["189"],
      occupation,
      "SUBMITTED",
      points,
      "<20",
    ];
    const file: RawViewFile = {
      viewId: "pool-by-score",
      asAt: "2026-10",
      fetchedAt: "2026-11-17T00:00:00Z",
      source: "https://example.test",
      selections: {},
      parts: [
        {
          partition: {},
          table: encodeRaw(HEADERS.byScore, [
            row(SOFTWARE_ENGINEER, "65"),
            row(SOFTWARE_ENGINEER, "100"),
            row(NURSE, "65"),
            row(NURSE, "70"),
          ]),
        },
      ],
    };
    expect(poolScores(file)).toEqual(["65", "70", "100"]);
  });
});
