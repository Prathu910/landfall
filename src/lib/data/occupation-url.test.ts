import { describe, expect, it } from "vitest";
import { occupationDataUrl, publishedOccupationCode } from "./occupation-url";

const index = [
  { code: "261313", name: "Software Engineer", hasData: true },
  { code: "221111", name: "Accountant (General)", hasData: false },
];

describe("occupationDataUrl", () => {
  it("returns the core and detail URLs for a known code", () => {
    expect(occupationDataUrl("261313", index, "core")).toBe(
      "/data/occupations/261313.json",
    );
    expect(occupationDataUrl("261313", index, "detail")).toBe(
      "/data/occupations/261313.detail.json",
    );
  });

  it("returns null for path traversal and unknown codes", () => {
    expect(occupationDataUrl("../etc", index, "core")).toBeNull();
    expect(occupationDataUrl("999999", index, "core")).toBeNull();
  });
});

describe("publishedOccupationCode", () => {
  it("returns an indexed code that has published data", () => {
    expect(publishedOccupationCode("261313", index)).toBe("261313");
  });

  it("returns null for an indexed code without data, an unknown code and the points-only choice", () => {
    expect(publishedOccupationCode("221111", index)).toBeNull();
    expect(publishedOccupationCode("999999", index)).toBeNull();
    expect(publishedOccupationCode("other", index)).toBeNull();
    expect(publishedOccupationCode("", index)).toBeNull();
  });
});
