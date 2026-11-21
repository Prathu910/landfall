import { describe, expect, it } from "vitest";
import { REPORT_BANNED_COPY } from "../report/copy";
import { METHOD_LIMITS, METHOD_LINES } from "./method";

describe("method copy", () => {
  it("labels the estimated wait as an estimate (spec 6.5)", () => {
    const wait = METHOD_LINES.find((line) => line.startsWith("Estimated wait"));
    expect(wait).toBeDefined();
    expect(wait).toMatch(/estimate/);
    expect(wait).toMatch(/never a percentage/);
  });

  it("says what the labels and waits are, without the old 'does not advise' line", () => {
    const text = METHOD_LIMITS.join(" ");
    expect(text).not.toMatch(/advise which visa/);
    expect(text).not.toMatch(/predict an invitation/);
    expect(text).toMatch(/computed from published SkillSelect history/);
    expect(text).toMatch(/estimates/);
    expect(text).toMatch(/no percentages/);
  });

  it("passes the report's banned-copy rules", () => {
    for (const line of [...METHOD_LINES, ...METHOD_LIMITS]) {
      expect(line).not.toMatch(REPORT_BANNED_COPY);
    }
  });
});
