import { describe, expect, it } from "vitest";
import { activityCoreFixture, coreFixture } from "./__fixtures__/occupation";
import { invitationActivity } from "./invitations";

describe("invitationActivity", () => {
  it("lists covered months in the calendar window, oldest first", () => {
    const a = invitationActivity(activityCoreFixture, "189", 7);
    expect(a.months.map((m) => m.asAt)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
    expect(a.months[1].invitedAtLeast).toEqual({ min: 905, max: 905 });
    expect(a.months[2].invitedAtLeast).toEqual({ min: 0, max: 19 });
    expect(a.lastConfirmedMonth).toBe("2026-06");
    expect(a.lastPossibleMonth).toBe("2026-07");
  });

  it("reads a covered month with no INVITED row as zero", () => {
    const a = invitationActivity(activityCoreFixture, "189", 7);
    const byMonth = new Map(a.months.map((m) => [m.asAt, m.invitedAtLeast]));
    expect(byMonth.get("2026-08")).toEqual({ min: 0, max: 0 });
    expect(byMonth.get("2026-09")).toEqual({ min: 0, max: 0 });
  });

  it("reports an uncovered month as not published, never zero", () => {
    const a = invitationActivity(activityCoreFixture, "189", 7);
    expect(a.notPublished).toEqual(["2026-04"]);
    expect(a.months.some((m) => m.asAt === "2026-04")).toBe(false);
  });

  it("builds the window back from asAt, not from the stored keys", () => {
    const a = invitationActivity(activityCoreFixture, "189", 2);
    expect(a.months.map((m) => m.asAt)).toEqual(["2026-09", "2026-10"]);
    expect(a.lastConfirmedMonth).toBeNull();
    expect(a.lastPossibleMonth).toBeNull();
  });

  it("derives the score range from positive cells in the last 12 calendar months", () => {
    // 2025-09 (score 60) is outside the window ending 2026-10.
    expect(invitationActivity(activityCoreFixture, "189").scoreRange).toEqual({
      min: 90,
      max: 100,
    });
  });

  it("marks every month not published without status history", () => {
    const a = invitationActivity(coreFixture, "190", 3);
    expect(a).toEqual({
      months: [],
      notPublished: ["2026-08", "2026-09", "2026-10"],
      lastConfirmedMonth: null,
      lastPossibleMonth: null,
      scoreRange: null,
    });
  });
});
