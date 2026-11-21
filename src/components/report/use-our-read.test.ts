import { describe, expect, it } from "vitest";
import { readTemplate } from "../../lib/outlook/read-template";
import type { ReportFacts } from "../../lib/outlook/read-contract";
import { decideRead } from "./use-our-read";

const FACTS: ReportFacts = {
  occupation: "Registered Nurses nec",
  dataMonth: "October 2026",
  situation: "189",
  lodged: false,
  stamp: { visa: "189", state: null, label: "Competitive" },
  visas: [
    {
      visa: "189",
      label: "Competitive",
      state: null,
      points: 70,
      caption: "Competitive at your points.",
    },
  ],
  counts: [{ name: "invited", text: "168", numbers: [168] }],
  route: [],
  wait: "Uncertain.",
  changes: [],
  extraNumbers: [],
};
const TEMPLATE = readTemplate(FACTS);
const GOOD = `${Array.from({ length: 45 }, () => "steady").join(" ")} at 70 points.`;

describe("decideRead", () => {
  it("returns the template when there is no reply", () => {
    expect(decideRead(null, FACTS, TEMPLATE)).toEqual({
      text: TEMPLATE,
      source: "template",
    });
  });

  it("returns the template when the reply fails the check", () => {
    const invented = `${GOOD} Also 999 people were invited.`;
    expect(decideRead(invented, FACTS, TEMPLATE).source).toBe("template");
    expect(decideRead("too short", FACTS, TEMPLATE).source).toBe("template");
  });

  it("returns a reply that passes the check", () => {
    expect(decideRead(GOOD, FACTS, TEMPLATE)).toEqual({
      text: GOOD,
      source: "ai",
    });
  });
});
