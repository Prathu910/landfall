import { describe, expect, it } from "vitest";
import { coreFixture, detailFixture } from "./__fixtures__/occupation";
import { isOccupationCore, isOccupationDetail } from "./guards";
import { poolPosition } from "./pool-position";

function pos(score: number, month: string | null = null, withDetail = true) {
  const p = poolPosition(
    coreFixture,
    withDetail ? detailFixture : null,
    "189",
    score,
    month,
  );
  if (!p.available) throw new Error("expected available");
  return p;
}

describe("fixtures", () => {
  it("pass the runtime guards", () => {
    expect(isOccupationCore(coreFixture)).toBe(true);
    expect(isOccupationDetail(detailFixture)).toBe(true);
  });
});

describe("poolPosition", () => {
  it("sums higher, same and total as intervals", () => {
    const p = pos(90);
    expect(p.higher).toEqual({ min: 50, max: 50 });
    expect(p.same).toEqual({ min: 0, max: 19 });
    expect(p.total).toEqual({ min: 150, max: 150 });
  });

  it("normalises to the 5-point band", () => {
    expect(pos(47).score).toBe(45);
  });

  it("has no higher rows above the top score", () => {
    expect(pos(135).higher).toEqual({ min: 0, max: 0 });
  });

  it("is unavailable when the visa has no pool", () => {
    expect(poolPosition(coreFixture, null, "491", 90, null)).toEqual({
      available: false,
      reason: "no-eois-for-visa",
    });
  });

  it("splits same-score EOIs by submitted month", () => {
    expect(pos(90, "2025-03").sameSubmitted).toEqual({
      before: { min: 30, max: 49 },
      sameMonth: { min: 25, max: 25 },
      after: { min: 40, max: 40 },
      approximate: true,
    });
  });

  it("omits the split without detail or month", () => {
    expect(pos(90, "2025-03", false).sameSubmitted).toBeUndefined();
    expect(pos(90, null).sameSubmitted).toBeUndefined();
  });
});
