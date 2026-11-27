import { describe, expect, it } from "vitest";
import { A, B, C, FIXTURE_CORES } from "./__fixtures__/cores";
import { topStateOccupations } from "./occupations";

describe("topStateOccupations", () => {
  it("ranks published floors first and leaves out all-hidden occupations", () => {
    const { rows, withPublished } = topStateOccupations(
      FIXTURE_CORES,
      "190",
      "NSW",
      "2026-10",
    );
    expect(rows.map((r) => r.code)).toEqual([A.code, B.code]);
    expect(withPublished).toBe(2);
    expect(rows[0]).toMatchObject({
      latest: { min: 61, max: 80 },
      publishedScores: { min: 80, max: 85 },
      monthsWith20: 2,
    });
    expect(rows[1].monthsWith20).toBe(1);
  });

  it("breaks ties by months with a count, then by code", () => {
    const twin = { ...B, code: "000001" };
    const { rows } = topStateOccupations([B, twin], "190", "NSW", "2026-10");
    expect(rows.map((r) => r.code)).toEqual(["000001", B.code]);
  });

  it("returns no rows when every count is hidden", () => {
    const result = topStateOccupations([C], "190", "NSW", "2026-10");
    expect(result).toEqual({ rows: [], withPublished: 0 });
  });

  it("limits the rows but counts every occupation with a published count", () => {
    const result = topStateOccupations(
      FIXTURE_CORES,
      "190",
      "NSW",
      "2026-10",
      1,
    );
    expect(result.rows).toHaveLength(1);
    expect(result.withPublished).toBe(2);
  });
});
