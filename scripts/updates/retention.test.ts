import { describe, expect, it } from "vitest";
import { retentionPlan } from "./retention";

const month = (m: string) => [
  `public/social/${m}/og.png`,
  `public/social/${m}/month/cover-light.png`,
  `public/social/${m}/month/set.json`,
  `public/social/${m}/round-${m}-15/og.png`,
  `public/social/${m}/round-${m}-15/round-dark.png`,
];
const files = ["2026-07", "2026-08", "2026-09", "2026-10"].flatMap(month);
const dirs = ["2026-07", "2026-08", "2026-09", "2026-10"];

describe("retentionPlan", () => {
  it("deletes every file of the month older than the latest three, except og.png", () => {
    expect(retentionPlan(dirs, files, "2026-10")).toEqual([
      "public/social/2026-07/month/cover-light.png",
      "public/social/2026-07/month/set.json",
      "public/social/2026-07/round-2026-07-15/round-dark.png",
    ]);
  });

  it("never deletes an og.png, including a round set's", () => {
    const plan = retentionPlan(dirs, files, "2026-10");
    expect(plan.some((file) => file.endsWith("/og.png"))).toBe(false);
  });

  it("keeps everything when there are three months or fewer", () => {
    expect(retentionPlan(["2026-10"], month("2026-10"), "2026-10")).toEqual([]);
    expect(retentionPlan(dirs.slice(1), files.slice(5), "2026-10")).toEqual([]);
  });

  it("ignores months after the latest", () => {
    expect(retentionPlan(dirs, files, "2026-09")).toEqual([]);
  });
});
