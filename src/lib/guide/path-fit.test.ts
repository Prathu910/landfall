import { describe, expect, it } from "vitest";
import { stateRuleData } from "../../components/data/state-rule-data";
import type { StateCode, StateVisa } from "../data/types";
import { pathFit, type PathFit } from "./path-fit";

const OFFSHORE = { kind: "offshore" } as const;

function status(fit: PathFit, state: StateCode, visa: StateVisa) {
  return fit.states.find((s) => s.state === state)?.byVisa[visa].status;
}

describe("pathFit", () => {
  it("reads the visas from the Home Affairs list", () => {
    expect(pathFit("254499", OFFSHORE, stateRuleData).visas).toEqual({
      "189": true,
      "190": true,
      "491": true,
    });
    expect(pathFit("121212", OFFSHORE, stateRuleData).visas["189"]).toBe(false);
  });

  it("names the states whose lists include the reader's situation", () => {
    const fit = pathFit("254499", OFFSHORE, stateRuleData);
    expect(fit.openToYou["190"]).toEqual(["NSW", "QLD", "WA", "SA"]);
    expect(status(fit, "VIC", "190")).toBe("checking");
  });

  it("separates a listing that is only for people living in the state", () => {
    const fit = pathFit("261313", OFFSHORE, stateRuleData);
    expect(status(fit, "QLD", "190")).toBe("other-situation");
    expect(fit.states.find((s) => s.state === "QLD")?.byVisa["190"].text).toBe(
      "Listed for people living in QLD only",
    );
    expect(status(fit, "WA", "190")).toBe("open-to-you");
  });

  it("treats living in a state as living elsewhere for the others", () => {
    const fit = pathFit(
      "261313",
      { kind: "onshore", state: "SA" },
      stateRuleData,
    );
    expect(status(fit, "SA", "190")).toBe("open-to-you");
    expect(status(fit, "QLD", "190")).toBe("other-situation");
    expect(status(fit, "WA", "190")).toBe("open-to-you");
  });

  it("says not listed only where an imported list was checked", () => {
    const fit = pathFit("121212", OFFSHORE, stateRuleData);
    expect(status(fit, "SA", "190")).toBe("not-listed");
    expect(status(fit, "WA", "190")).toBe("open-to-you");
  });

  it("closes every state for a visa the occupation is not listed for", () => {
    const fit = pathFit("111111", OFFSHORE, stateRuleData);
    for (const state of fit.states) {
      expect(state.byVisa["190"].status).toBe("off-federal");
      expect(state.byVisa["491"].status).toBe("off-federal");
    }
    expect(fit.openToYou).toEqual({ "190": [], "491": [] });
  });

  it("leaves the visas unknown when the federal list cannot be read", () => {
    const fit = pathFit("254499", OFFSHORE, {
      ...stateRuleData,
      federal: null,
    });
    expect(fit.visas).toEqual({ "189": null, "190": null, "491": null });
    expect(status(fit, "WA", "190")).toBe("open-to-you");
  });

  it("covers all eight states and territories in a fixed order", () => {
    const fit = pathFit("254499", OFFSHORE, stateRuleData);
    expect(fit.states.map((s) => s.state)).toEqual([
      "NSW",
      "VIC",
      "QLD",
      "WA",
      "SA",
      "ACT",
      "TAS",
      "NT",
    ]);
  });
});
