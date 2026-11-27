import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import type { StateRuleData } from "../report/state-outlook-view";
import { rulesCheckedAt, selectionLines, streamRows } from "./program";

describe("state program rows", () => {
  it("prints a verified closed stream as closed for the program year", () => {
    const nsw491 = streamRows(stateRuleData, "NSW").filter(
      (r) => r.visa === "491",
    );
    expect(nsw491.length).toBeGreaterThan(0);
    for (const row of nsw491) expect(row.status).toBe("Closed in 2026–27");
  });

  it("reads secondary status or cohorts as rules being checked", () => {
    for (const row of streamRows(stateRuleData, "ACT")) {
      expect(row.verified).toBe(false);
      expect(row.status).toBe("Rules being checked");
      expect(row.who).toBe("Rules being checked");
    }
  });

  it("keeps the selection text with its date and verification", () => {
    const [line] = selectionLines(stateRuleData, "VIC");
    expect(line.scoreSystem?.name).toMatch(/Victorian Points Test/);
    expect(line.verified).toBe(false);
    expect(line.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("dates the rules by the newest check, imported lists included", () => {
    const data: StateRuleData = {
      ...stateRuleData,
      lists: {
        ...stateRuleData.lists,
        nsw: { ...stateRuleData.lists.nsw, checkedAt: "2027-01-05" },
      },
    };
    expect(rulesCheckedAt(data, "NSW")).toBe("2027-01-05");
    expect(rulesCheckedAt(stateRuleData, "NSW")).toMatch(/^2026-11-1\d$/);
  });
});
