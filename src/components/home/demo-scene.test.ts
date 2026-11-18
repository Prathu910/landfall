import { describe, expect, it } from "vitest";
import { EMPTY_SCENE, PAYOFF_SCENE, groupsOf, splitLine } from "./demo-scene";

const tiles = [
  { state: "ACT", tone: "unverified", group: "Not yet verified", label: "A" },
  { state: "NT", tone: "unverified", group: "Not yet verified", label: "N" },
  { state: "NSW", tone: "not-open", group: "Not open to you now", label: "S" },
  { state: "QLD", tone: "not-open", group: "Not open to you now", label: "Q" },
] as const;

describe("groupsOf", () => {
  it("lists each group once, in the outlook's tile order", () => {
    expect(groupsOf([...tiles])).toEqual([
      { tone: "unverified", label: "Not yet verified" },
      { tone: "not-open", label: "Not open to you now" },
    ]);
  });
});

describe("splitLine", () => {
  it("splits a profile line into its label and points", () => {
    expect(splitLine("Age · 30 pts")).toEqual({
      label: "Age",
      value: "30 pts",
    });
  });

  it("keeps a line without a separator whole", () => {
    expect(splitLine("90 points")).toEqual({ label: "90 points", value: "" });
  });
});

describe("scenes", () => {
  it("opens on the whole report, and Start over goes to an empty check", () => {
    expect(PAYOFF_SCENE).toEqual({
      view: "report",
      answered: true,
      total: true,
      counted: true,
      lit: Number.POSITIVE_INFINITY,
    });
    expect(EMPTY_SCENE).toEqual({
      view: "check",
      answered: false,
      total: false,
      counted: false,
      lit: 0,
    });
  });
});
