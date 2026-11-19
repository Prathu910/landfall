import { describe, expect, it } from "vitest";
import { fullReportHref } from "./try-it-href";

describe("fullReportHref", () => {
  it("links to the check flow with only the occupation code", () => {
    expect(fullReportHref("261313")).toBe("/check/?occupation=261313");
  });
  it("carries no points total", () => {
    expect(fullReportHref("261313")).not.toMatch(/points|total|85/);
  });
});
