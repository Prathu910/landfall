import { describe, expect, it } from "vitest";
import index from "../../src/data/occupation-index.json";
import { popularOccupations } from "../../src/lib/updates/spotlight";
import { loadAllCores } from "../updates/generate";
import { SPOTLIGHT_TITLE, estimatedLines, fitTitle, textEm } from "./title-fit";

/** A fixture no size fits: one word wider than the title column. */
const UNBREAKABLE = "Supercalifragilisticexpialidocious Specialist";

// Spec 6.8 picks the spotlight among these 20.
const popular = popularOccupations(loadAllCores(), "2026-10");

describe("fitTitle", () => {
  it("fits every one of the 20 most popular names in the spotlight", () => {
    expect(popular).toHaveLength(20);
    for (const { name } of popular)
      expect(fitTitle(name, SPOTLIGHT_TITLE).fits, name).toBe(true);
  });

  it("fits every occupation name in the index, for a founder's swap", () => {
    const misfits = index
      .map((entry) => entry.name)
      .filter((name) => !fitTitle(name, SPOTLIGHT_TITLE).fits);
    expect(misfits).toEqual([]);
  });

  it("keeps a name that fits at the mockup's size", () => {
    expect(fitTitle("Registered Nurses nec", SPOTLIGHT_TITLE)).toEqual({
      size: 80,
      fits: true,
    });
  });

  it("steps down for long names and long words", () => {
    expect(fitTitle("Developer Programmer", SPOTLIGHT_TITLE).size).toBe(64);
    expect(
      fitTitle("Early Childhood (Pre-primary School) Teacher", SPOTLIGHT_TITLE)
        .size,
    ).toBe(52);
    expect(fitTitle("Telecommunications Engineer", SPOTLIGHT_TITLE).size).toBe(
      40,
    );
  });

  it("says when nothing fits, so the render fails rather than clips", () => {
    expect(fitTitle(UNBREAKABLE, SPOTLIGHT_TITLE)).toEqual({
      size: 40,
      fits: false,
    });
  });
});

describe("estimatedLines", () => {
  it("wraps between words only", () => {
    expect(estimatedLines("Software Engineer", 80, 506)).toBe(2);
    expect(estimatedLines("Chef", 80, 506)).toBe(1);
  });
  it("treats a word wider than the box as never fitting", () => {
    expect(estimatedLines("Programmer", 80, 506)).toBe(Infinity);
  });
  it("errs wide of the measured face", () => {
    // Measured in Chrome at 100px: "Programmer" 6.71em, "Registered" 5.87em.
    expect(textEm("Programmer")).toBeGreaterThan(6.71);
    expect(textEm("Registered")).toBeGreaterThan(5.87);
  });
});
