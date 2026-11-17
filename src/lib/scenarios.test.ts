import { describe, it, expect } from "vitest";
import { sampleProfile, calculatePoints } from "./migration";
import { buildScenarios, applyScenarios } from "./scenarios";
describe("credential scenarios", () => {
  it("recalculates the employment cap instead of adding independent point bonuses", () => {
    const p = { ...sampleProfile, overseasYears: 8, australianYears: 5 };
    expect(
      calculatePoints(applyScenarios(p, ["australian-work"]), "2026-11-17")
        .base,
    ).toBe(calculatePoints(p, "2026-11-17").base);
  });
  it("does not offer improving English to a profile already at Superior", () => {
    expect(buildScenarios(sampleProfile).some((s) => s.id === "english")).toBe(
      false,
    );
  });
  it("renewed evidence is hypothetical, not silently applied to the original", () => {
    const p = { ...sampleProfile, english: "proficient" as const };
    const updated = applyScenarios(p, ["english"], "2026-11-17");
    expect(updated.english).toBe("superior");
    expect(updated.englishDate).toBe("2026-11-17");
    expect(p.english).toBe("proficient");
  });
  it("preserves unrelated personal answers and ignores unknown choices", () => {
    expect(applyScenarios(sampleProfile, ["invalid"])).toEqual(sampleProfile);
  });
  it("offers replacement evidence when existing Superior or language evidence has expired", () => {
    const p = {
      ...sampleProfile,
      englishDate: "2020-01-01",
      communityLanguage: true,
      communityLanguageExpiry: "2024-01-01",
    };
    const options = buildScenarios(p, "2026-11-17");
    expect(options.some((s) => s.id === "english")).toBe(true);
    expect(options.some((s) => s.id === "language")).toBe(true);
    expect(
      calculatePoints(
        applyScenarios(p, ["english", "language"], "2026-11-17"),
        "2026-11-17",
      ).base,
    ).toBeGreaterThan(calculatePoints(p, "2026-11-17").base);
  });
});
