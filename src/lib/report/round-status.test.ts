import { describe, expect, it } from "vitest";
import { CHIP_LABEL, summarise189Rounds } from "./round-status";

describe("summarise189Rounds", () => {
  it("reports none when the last four rounds list nothing", () => {
    const result = summarise189Rounds([
      { date: "2025-03-01", cutoff: null },
      { date: "2025-02-01", cutoff: null },
      { date: "2025-01-01", cutoff: null },
      { date: "2024-12-01", cutoff: null },
      { date: "2024-11-07", cutoff: 95 },
      { date: "2024-09-05", cutoff: 100 },
    ]);
    expect(result.status).toBe("none");
    expect(result.listedInLastFour).toBe(0);
    expect(result.roundsConsidered).toBe(4);
    expect(result.latestCutoff).toEqual({ date: "2024-11-07", cutoff: 95 });
    expect(result.latestCutoffInLastFour).toBeNull();
  });
  it("reports regular when all four are listed", () => {
    const rounds = [90, 91, 92, 93].map((cutoff, i) => ({
      date: `2025-0${4 - i}-01`,
      cutoff,
    }));
    const result = summarise189Rounds(rounds);
    expect(result.status).toBe("regular");
    expect(result.listedInLastFour).toBe(4);
    expect(result.latestCutoffInLastFour).toEqual({
      date: "2025-04-01",
      cutoff: 90,
    });
  });
  it("reports occasional when some are listed", () => {
    const result = summarise189Rounds([
      { date: "2025-04-01", cutoff: null },
      { date: "2025-03-01", cutoff: 80 },
      { date: "2025-02-01", cutoff: null },
      { date: "2025-01-01", cutoff: 85 },
    ]);
    expect(result.status).toBe("occasional");
    expect(result.listedInLastFour).toBe(2);
  });
  it("uses fewer rounds when fewer exist", () => {
    const result = summarise189Rounds([{ date: "2025-04-01", cutoff: 80 }]);
    expect(result.status).toBe("regular");
    expect(result.roundsConsidered).toBe(1);
  });
  it("handles no rounds", () => {
    expect(summarise189Rounds([])).toEqual({
      status: "none",
      listedInLastFour: 0,
      roundsConsidered: 0,
      latestCutoff: null,
      latestCutoffInLastFour: null,
    });
  });
  it("labels each status", () => {
    expect(CHIP_LABEL).toEqual({
      regular: "Regular invitations",
      occasional: "Occasional invitations",
      none: "No recent invitations",
    });
  });
});
