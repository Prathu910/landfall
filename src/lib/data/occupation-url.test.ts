import { describe, expect, it } from "vitest";
import { occupationDataUrl } from "./occupation-url";

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
