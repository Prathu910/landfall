import { afterEach, describe, expect, it, vi } from "vitest";
import { realGh } from "./gh";

describe("realGh in a dry run", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("sends nothing: reads return [] and writes return nothing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const gh = realGh(true);
    expect(gh(["issue", "list", "--json", "number,title"])).toBe("[]");
    expect(gh(["issue", "create", "--title", "t"])).toBe("");
  });

  it("returns DRY_RUN_OPEN_PRS for pr list only, for local join tests", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DRY_RUN_OPEN_PRS", '[{"number":9,"headRefName":"data/x"}]');
    const gh = realGh(true);
    expect(gh(["pr", "list", "--label", "data-update"])).toBe(
      '[{"number":9,"headRefName":"data/x"}]',
    );
    expect(gh(["issue", "list"])).toBe("[]");
  });
});
