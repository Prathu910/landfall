import { describe, expect, it } from "vitest";
import { buildLosses } from "./losses";
import { deadlineTitle } from "./route-deadlines";
import { emptyProfile } from "../migration";

const SHIFT = { points: 90, label: "very-strong" } as const;

describe("deadlineTitle", () => {
  it("parses the birthday title shape made by buildLosses", () => {
    const profile = {
      ...emptyProfile,
      dob: "1994-03-14",
      english: "proficient" as const,
      englishDate: "2025-02-02",
      eoiDate: "2026-03-12",
    };
    const losses = buildLosses(profile, "2026-11-21", null, {
      points: 70,
      eligible: true,
      label: "competitive",
    });
    const byKind = (kind: string) => losses.find((l) => l.kind === kind);
    expect(byKind("points")?.title).toMatch(
      /^Your 33rd birthday, 14 Mar 2027: −5$/,
    );
    expect(deadlineTitle(byKind("points")!)).toBe("Turns 33: −5");
    expect(deadlineTitle(byKind("eligibility")!)).toBe("English test expires");
    expect(deadlineTitle(byKind("eoi-expiry")!)).toBe("EOI expires");
  });

  it("strips a date suffix only", () => {
    const loss = {
      date: "2028-02-02",
      title: "English test expires, 2 Feb 2028",
      detail: "",
      from: SHIFT,
      to: SHIFT,
      kind: "eligibility" as const,
    };
    expect(deadlineTitle(loss)).toBe("English test expires");
  });
});
