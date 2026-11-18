import { describe, expect, it } from "vitest";
import { stateRuleData } from "./state-rule-data";

describe("stateRuleData", () => {
  it("loads every imported state list and the federal list", () => {
    expect(Object.keys(stateRuleData.lists).sort()).toEqual([
      "nsw",
      "qld",
      "sa",
      "wa",
    ]);
    expect(stateRuleData.federal).not.toBeNull();
  });

  it("references only lists it loads", () => {
    const referenced = new Set(
      stateRuleData.rules.rules.flatMap((r) =>
        r.streams.flatMap((s) =>
          s.occupations.value.kind === "list"
            ? [s.occupations.value.listId]
            : [],
        ),
      ),
    );
    for (const id of referenced) expect(stateRuleData.lists).toHaveProperty(id);
  });
});
