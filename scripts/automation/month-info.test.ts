import { describe, expect, it } from "vitest";
import {
  monthInfoLines,
  occupationName,
  parseMonthInfoArgs,
} from "./month-info";

describe("parseMonthInfoArgs", () => {
  it("reads both flags, and neither is required", () => {
    expect(parseMonthInfoArgs([])).toEqual({ month: null, spotlight: null });
    expect(
      parseMonthInfoArgs(["--month", "2026-11", "--spotlight", "254499"]),
    ).toEqual({ month: "2026-11", spotlight: "254499" });
  });

  it("rejects a malformed month or code, and unknown flags", () => {
    expect(() => parseMonthInfoArgs(["--month", "2026-13"])).toThrow(/--month/);
    expect(() => parseMonthInfoArgs(["--month"])).toThrow(/--month/);
    expect(() => parseMonthInfoArgs(["--spotlight", "25449"])).toThrow(
      /--spotlight/,
    );
    expect(() => parseMonthInfoArgs(["--title", "x"])).toThrow(/Unknown/);
  });
});

describe("occupationName", () => {
  const index = [{ code: "254499", name: "Registered Nurses nec" }];

  it("finds the name, and throws for a code the index lacks", () => {
    expect(occupationName(index, "254499")).toBe("Registered Nurses nec");
    expect(() => occupationName(index, "999999")).toThrow(/999999/);
  });
});

describe("monthInfoLines", () => {
  it("names the month for titles and says whether main has its data", () => {
    expect(
      monthInfoLines({
        manifestMonth: "2026-12",
        month: "2027-01",
        dataOnBase: false,
        spotlightName: null,
      }),
    ).toEqual([
      "manifest_month=2026-12",
      "month=2027-01",
      "previous_month=2026-12",
      "short=Jan 2027",
      "long=January 2027",
      "data_on_base=no",
    ]);
  });

  it("adds the spotlight name on one line", () => {
    const lines = monthInfoLines({
      manifestMonth: "2026-10",
      month: "2026-10",
      dataOnBase: true,
      spotlightName: "Registered\nNurses nec",
    });
    expect(lines).toContain("data_on_base=yes");
    expect(lines.at(-1)).toBe("spotlight_name=Registered Nurses nec");
  });
});
