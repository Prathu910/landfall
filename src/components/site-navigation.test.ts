import { describe, expect, it } from "vitest";
import { isNavigationActive } from "./site-navigation";

describe("shared navigation", () => {
  it("marks an index and its detail routes as active", () => {
    for (const pathname of [
      "/occupations",
      "/occupations/",
      "/occupations/software-engineer/",
    ]) {
      expect(isNavigationActive(pathname, "/occupations/")).toBe(true);
    }
  });
  it("does not match a partial route name or another destination", () => {
    expect(isNavigationActive("/occupations-guide/", "/occupations/")).toBe(
      false,
    );
    expect(isNavigationActive("/check/", "/sample/")).toBe(false);
    expect(isNavigationActive("/", "/states/")).toBe(false);
  });
});
