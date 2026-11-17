import { describe, expect, it } from "vitest";
import { assertWithinGuardrail, VIEWS, type ViewDefinition } from "./views";

describe("VIEWS", () => {
  it("declares the nine views, all within the guardrail", () => {
    expect(VIEWS.map((v) => v.id)).toHaveLength(9);
    for (const view of VIEWS)
      expect(() => assertWithinGuardrail(view)).not.toThrow();
  });

  it("rejects three shown columns", () => {
    const bad: ViewDefinition = {
      ...VIEWS[0],
      shown: ["occupation", "points", "state"],
    };
    expect(() => assertWithinGuardrail(bad)).toThrow();
  });

  it("counts an attribute variant as a shown column", () => {
    const bad: ViewDefinition = {
      ...VIEWS[0],
      shown: ["occupation", "points"],
      attributeVariants: ["english"],
    };
    expect(() => assertWithinGuardrail(bad)).toThrow();
  });

  it("rejects three partition filters", () => {
    const bad: ViewDefinition = {
      ...VIEWS[0],
      partitionBy: ["state", "score", "english"],
    };
    expect(() => assertWithinGuardrail(bad)).toThrow();
  });
});
