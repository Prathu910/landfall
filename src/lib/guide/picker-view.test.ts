import { describe, expect, it } from "vitest";
import { occupationIndex } from "../../components/data/occupation-index";
import { stateRuleData } from "../../components/data/state-rule-data";
import { pathFit, type PickerSituation } from "./path-fit";
import { pickerView } from "./picker-view";

const entry = (code: string) => occupationIndex.find((e) => e.code === code)!;
const view = (code: string, situation: PickerSituation) =>
  pickerView(pathFit(code, situation, stateRuleData), entry(code), situation);

describe("pickerView", () => {
  it("stamps each visa as on or off the Home Affairs list", () => {
    const v = view("121212", { kind: "offshore" });
    expect(v.visas.map((s) => [s.visa, s.status])).toEqual([
      ["189", "off"],
      ["190", "on"],
      ["491", "on"],
    ]);
  });

  it("names the states that list the occupation for the reader", () => {
    const v = view("254499", { kind: "offshore" });
    expect(v.stateLines[0]).toBe(
      "190: NSW, QLD, WA and SA list it for people outside Australia.",
    );
  });

  it("says so plainly when no state lists it for the reader", () => {
    const v = view("261313", { kind: "onshore", state: "TAS" });
    const line491 = v.stateLines.find((l) => l.startsWith("491"));
    expect(line491).toBe("491: WA lists it for people living in TAS.");
    // Not in the occupation index (no EOIs), and on no Home Affairs list.
    const offEntry = {
      code: "111111",
      name: "Chief Executive",
      hasData: false,
    };
    const off = pickerView(
      pathFit("111111", { kind: "offshore" }, stateRuleData),
      offEntry,
      { kind: "offshore" },
    );
    expect(off.stateLines).toEqual([
      "190 and 491: not on the Home Affairs list, so no state can nominate it.",
    ]);
  });

  it("links the guides for listed visas, the occupation page and the check", () => {
    const v = view("121212", { kind: "offshore" });
    expect(v.guideLinks.map((l) => l.href)).toEqual([
      "/guide/190/",
      "/guide/491/",
    ]);
    expect(v.occupationHref).toBe("/occupations/flower-grower-121212/");
    expect(v.checkHref).toBe("/check/?occupation=121212");
  });

  it("drops the occupation page link when the occupation has no data", () => {
    const noData = occupationIndex.find((e) => !e.hasData)!;
    const v = pickerView(
      pathFit(noData.code, { kind: "offshore" }, stateRuleData),
      noData,
      { kind: "offshore" },
    );
    expect(v.occupationHref).toBeNull();
  });
});
