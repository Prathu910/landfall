import { describe, expect, it } from "vitest";
import { monthOfDate, sydneyDate } from "./dates";

describe("dates", () => {
  it("gives the Sydney calendar date", () => {
    expect(sydneyDate(new Date("2026-11-24T20:30:00Z"))).toBe("2026-11-25");
    expect(sydneyDate(new Date("2026-11-24T10:00:00Z"))).toBe("2026-11-24");
  });
  it("gives the month of a round date", () => {
    expect(monthOfDate("2026-10-15")).toBe("2026-10");
  });
});
