import { describe, expect, it } from "vitest";
import { fullReportHref, occupationPageLink } from "./try-it-href";

describe("fullReportHref", () => {
  it("links to the check flow with only the occupation code", () => {
    expect(fullReportHref("261313")).toBe("/check/?occupation=261313");
  });
  it("carries no points total", () => {
    expect(fullReportHref("261313")).not.toMatch(/points|total|85/);
  });
});

describe("occupationPageLink", () => {
  const entry = { code: "261313", name: "Software Engineer", hasData: true };
  it("links to the chosen occupation's page", () => {
    expect(occupationPageLink(entry)).toEqual({
      href: "/occupations/software-engineer-261313/",
      text: "See the Software Engineer page",
    });
    expect(occupationPageLink(entry, "254499")).not.toBeNull();
  });
  it("is null on that occupation's own page or without an entry", () => {
    expect(occupationPageLink(entry, "261313")).toBeNull();
    expect(occupationPageLink(undefined)).toBeNull();
  });
});
