import { describe, expect, it } from "vitest";
import {
  bestLabel,
  isAtLeast,
  labelName,
  LABEL_RANK,
  stampName,
} from "./labels";

describe("labelName", () => {
  it("returns the display name for each label", () => {
    expect(labelName("very-strong")).toBe("Very strong");
    expect(labelName("strong")).toBe("Strong");
    expect(labelName("competitive")).toBe("Competitive");
    expect(labelName("long-wait")).toBe("Long wait");
    expect(labelName("not-eligible")).toBe("Not eligible yet");
    expect(labelName("not-open")).toBe("Not open to you");
    expect(labelName("not-invited")).toBe("Not currently invited");
    expect(labelName("no-data")).toBe("Not enough data");
  });

  it("says too few to count for masked no-data", () => {
    expect(labelName("no-data", true)).toBe("Too few to count");
  });

  it("ignores tooFew for other labels", () => {
    expect(labelName("strong", true)).toBe("Strong");
  });
});

describe("stampName", () => {
  it("uses short names where they differ", () => {
    expect(stampName("not-invited")).toBe("Not invited");
    expect(stampName("not-eligible")).toBe("Not eligible");
    expect(stampName("not-open")).toBe("Not open");
    expect(stampName("no-data")).toBe("No data");
    expect(stampName("very-strong")).toBe("Very strong");
  });

  it("says too few to count for masked no-data", () => {
    expect(stampName("no-data", true)).toBe("Too few to count");
  });
});

describe("bestLabel", () => {
  it("picks the best-ranked label", () => {
    expect(bestLabel(["not-invited", "long-wait", "no-data"])).toBe(
      "long-wait",
    );
    expect(bestLabel(["not-eligible", "not-open"])).toBe("not-eligible");
  });

  it("returns no-data for an empty list", () => {
    expect(bestLabel([])).toBe("no-data");
  });
});

describe("isAtLeast", () => {
  it("compares by rank", () => {
    expect(isAtLeast("strong", "competitive")).toBe(true);
    expect(isAtLeast("competitive", "competitive")).toBe(true);
    expect(isAtLeast("long-wait", "competitive")).toBe(false);
  });
});

describe("LABEL_RANK", () => {
  it("lists best first", () => {
    expect(LABEL_RANK[0]).toBe("very-strong");
    expect(LABEL_RANK[LABEL_RANK.length - 1]).toBe("no-data");
  });
});
