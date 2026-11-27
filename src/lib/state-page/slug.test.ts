import { describe, expect, it } from "vitest";
import { STATE_ORDER } from "../occupation-page/states";
import { STATE_PAGES, stateFromSlug, statePath } from "./slug";

describe("state page slugs", () => {
  it("has eight unique full-name slugs in the occupation pages' order", () => {
    expect(STATE_PAGES.map((p) => p.code)).toEqual(STATE_ORDER);
    expect(new Set(STATE_PAGES.map((p) => p.slug)).size).toBe(8);
    expect(statePath("NSW")).toBe("/states/new-south-wales/");
    expect(statePath("ACT")).toBe("/states/australian-capital-territory/");
  });

  it("round-trips every state through its path", () => {
    for (const { code } of STATE_PAGES) {
      const slug = statePath(code).split("/")[2];
      expect(stateFromSlug(slug)).toBe(code);
    }
  });

  it("returns null for an unknown slug or a bare code", () => {
    expect(stateFromSlug("nsw")).toBeNull();
    expect(stateFromSlug("")).toBeNull();
  });
});
