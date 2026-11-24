import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import { applyLinks } from "./apply-links";

describe("applyLinks", () => {
  it("links the guide for each visa the Home Affairs list has for the code", () => {
    expect(applyLinks("121212", stateRuleData.federal)).toEqual([
      { visa: "190", href: "/guide/190/?occupation=121212" },
      { visa: "491", href: "/guide/491/?occupation=121212" },
    ]);
    expect(
      applyLinks("254499", stateRuleData.federal).map((l) => l.visa),
    ).toEqual(["189", "190", "491"]);
  });
  it("links all three guides when the list can't be read", () => {
    expect(applyLinks("121212", null)).toHaveLength(3);
  });
  it("returns no visa links when no visa lists the code", () => {
    expect(applyLinks("111111", stateRuleData.federal)).toEqual([]);
  });
});
