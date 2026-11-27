import { describe, expect, it } from "vitest";
import { issuedFlagKey } from "./issued-flag";

describe("issuedFlagKey", () => {
  it("is stable per token and never contains the token", async () => {
    const token = "A".repeat(43);
    const key = await issuedFlagKey(token);
    expect(key).toMatch(/^ml-issued-[0-9a-f]{16}$/);
    expect(key).not.toContain(token);
    expect(await issuedFlagKey(token)).toBe(key);
    expect(await issuedFlagKey("B".repeat(43))).not.toBe(key);
  });
});
