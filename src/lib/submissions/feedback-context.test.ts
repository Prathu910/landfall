import { expect, it } from "vitest";
import { readFeedbackContext } from "./feedback-context";
const summary = {
  occupation_code: "254499",
  age_band: "25-32",
  location: "onshore",
  base_points: 75,
  points_190: 80,
  points_491: 90,
  snapshot_id: "skillselect-2026-10-31",
};
it("accepts a recent summary and rejects expired, future or contaminated context", () => {
  const make = (age: number, extra = {}) =>
    JSON.stringify({
      summary: { ...summary, ...extra },
      created_at: 1000000 - age,
    });
  expect(readFeedbackContext(make(100), 1000000)).toEqual(summary);
  expect(readFeedbackContext(make(900001), 1000000)).toBeNull();
  expect(readFeedbackContext(make(-1), 1000000)).toBeNull();
  expect(
    readFeedbackContext(make(100, { email: "private@example.com" }), 1000000),
  ).toBeNull();
  expect(readFeedbackContext("invalid", 1000000)).toBeNull();
});
