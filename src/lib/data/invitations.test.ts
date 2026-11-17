import { describe, expect, it } from "vitest";
import { activityCoreFixture, coreFixture } from "./__fixtures__/occupation";
import { invitationActivity } from "./invitations";

describe("invitationActivity", () => {
  it("orders months and reports confirmed and possible months", () => {
    const a = invitationActivity(activityCoreFixture, "189");
    expect(a.months.map((m) => m.asAt)).toEqual([
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(a.months[1].invitedAtLeast).toEqual({ min: 905, max: 905 });
    expect(a.months[2].invitedAtLeast).toEqual({ min: 0, max: 19 });
    expect(a.months[3].invitedAtLeast).toEqual({ min: 0, max: 0 });
    expect(a.lastConfirmedMonth).toBe("2026-06");
    expect(a.lastPossibleMonth).toBe("2026-07");
  });

  it("derives the score range from positive cells only", () => {
    expect(invitationActivity(activityCoreFixture, "189").scoreRange).toEqual({
      min: 90,
      max: 100,
    });
  });

  it("returns empty activity without status history", () => {
    expect(invitationActivity(coreFixture, "190")).toEqual({
      months: [],
      lastConfirmedMonth: null,
      lastPossibleMonth: null,
      scoreRange: null,
    });
  });
});
