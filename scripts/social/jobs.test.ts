import { describe, expect, it } from "vitest";
import {
  dataOnly,
  roundOnly,
  twoRounds,
} from "../../src/lib/updates/__fixtures__/recap-facts";
import { loadRecap } from "../../src/lib/updates/load-server";
import {
  jobsFor,
  monthSetJobs,
  parseRenderArgs,
  reusedRoundFiles,
  roundSetJobs,
} from "./jobs";

const oct = loadRecap("2026-10");
const ROUND_DIR = "public/social/2026-10/round-2026-10-15";

describe("roundSetJobs", () => {
  const jobs = roundSetJobs(oct, "2026-10-15");

  it("renders three feed cards and the story cover in both themes, and the OG image", () => {
    expect(jobs.map((j) => j.out)).toEqual(
      expect.arrayContaining([
        `${ROUND_DIR}/round-light.png`,
        `${ROUND_DIR}/story-cover-dark.png`,
        `${ROUND_DIR}/og.png`,
      ]),
    );
    expect(jobs).toHaveLength(9);
    expect(jobs.map((j) => j.out).sort()).toEqual(
      [
        "closing-dark.png",
        "closing-light.png",
        "cover-dark.png",
        "cover-light.png",
        "og.png",
        "round-dark.png",
        "round-light.png",
        "story-cover-dark.png",
        "story-cover-light.png",
      ].map((name) => `${ROUND_DIR}/${name}`),
    );
  });

  it("builds the story cover and the OG image from the round cover", () => {
    const covers = jobs.filter((j) => j.format !== "feed");
    expect(covers.map((j) => j.card.id)).toEqual([
      "round-cover",
      "round-cover",
      "round-cover",
    ]);
    expect(jobs.find((j) => j.format === "og")).toMatchObject({
      out: `${ROUND_DIR}/og.png`,
      theme: "light",
    });
  });
});

describe("monthSetJobs", () => {
  const jobs = monthSetJobs(oct);

  it("renders 13 images and never card 2", () => {
    expect(jobs).toHaveLength(13);
    expect(jobs.some((j) => j.card.id === "round")).toBe(false);
    const feed = jobs.filter((j) => j.format === "feed");
    expect(feed.map((j) => j.out)).toContain(
      "public/social/2026-10/month/state-491-dark.png",
    );
    expect(
      feed.every((j) => j.out.startsWith("public/social/2026-10/month/")),
    ).toBe(true);
  });

  it("writes the month's OG image beside the set folders, in light", () => {
    expect(jobs.find((j) => j.format === "og")).toMatchObject({
      out: "public/social/2026-10/og.png",
      theme: "light",
    });
    expect(jobs.filter((j) => j.format === "og")).toHaveLength(1);
  });

  it("builds the story cover from the full cover", () => {
    expect(
      jobs.filter((j) => j.format === "story").map((j) => [j.card.id, j.out]),
    ).toEqual([
      ["cover", "public/social/2026-10/month/story-cover-light.png"],
      ["cover", "public/social/2026-10/month/story-cover-dark.png"],
    ]);
  });

  it("renders the same 13 for a month without a round", () => {
    expect(monthSetJobs(dataOnly)).toHaveLength(13);
  });
});

describe("reusedRoundFiles", () => {
  it("names the newest round's card 2 files", () => {
    expect(reusedRoundFiles(oct)).toEqual([
      `${ROUND_DIR}/round-light.png`,
      `${ROUND_DIR}/round-dark.png`,
    ]);
    const [newest] = Object.keys(twoRounds.rounds).sort().reverse();
    expect(reusedRoundFiles(twoRounds)[0]).toContain(`/round-${newest}/`);
  });

  it("is empty for a month without a round", () => {
    expect(reusedRoundFiles(dataOnly)).toEqual([]);
  });
});

describe("parseRenderArgs", () => {
  it("reads a round set with its date", () => {
    expect(
      parseRenderArgs([
        "--month",
        "2026-10",
        "--set",
        "round",
        "--round",
        "2026-10-15",
      ]),
    ).toEqual({ month: "2026-10", set: "round", round: "2026-10-15" });
  });

  it("reads a month set written to HTML only", () => {
    expect(
      parseRenderArgs([
        "--month",
        "2026-10",
        "--set",
        "month",
        "--html-only",
        "tmp/cards",
      ]),
    ).toEqual({ month: "2026-10", set: "month", htmlOnly: "tmp/cards" });
  });

  it.each([
    [["--set", "month"], "--month YYYY-MM is required"],
    [["--month", "2026-13", "--set", "month"], "--month YYYY-MM is required"],
    [["--month", "2026-10"], "--set must be round or month"],
    [["--month", "2026-10", "--set", "week"], "--set must be round or month"],
    [
      ["--month", "2026-10", "--set", "month", "--round", "2026-10-15"],
      "--round is for --set round",
    ],
    [
      ["--month", "2026-10", "--set", "round", "--round", "15 Oct"],
      "--round must be YYYY-MM-DD",
    ],
    [["--month", "2026-10", "--set"], "--set needs a value"],
    [
      ["--month", "2026-10", "--set", "month", "--theme", "dark"],
      "Unknown flag --theme",
    ],
    [
      ["--month", "2026-10", "--month", "2026-09", "--set", "month"],
      "--month given twice",
    ],
  ])("rejects %j", (argv, message) => {
    expect(() => parseRenderArgs(argv)).toThrow(message);
  });
});

describe("jobsFor", () => {
  it("defaults the round set to the month's newest round", () => {
    const [newest] = Object.keys(twoRounds.rounds).sort().reverse();
    const jobs = jobsFor(twoRounds, { month: twoRounds.month, set: "round" });
    expect(jobs[0].out).toContain(`/round-${newest}/`);
  });

  it("renders a round-only month's round set", () => {
    expect(jobsFor(roundOnly, { month: "2026-11", set: "round" })).toHaveLength(
      9,
    );
  });

  it("rejects --set month for a month without a data section", () => {
    expect(() =>
      jobsFor(roundOnly, { month: "2026-11", set: "month" }),
    ).toThrow("2026-11 has no data section");
  });

  it("rejects --set round for a month without a round", () => {
    expect(() =>
      jobsFor(dataOnly, { month: dataOnly.month, set: "round" }),
    ).toThrow(`${dataOnly.month} has no 189 round`);
  });

  it("rejects a round that is not in the month", () => {
    expect(() =>
      jobsFor(oct, { month: "2026-10", set: "round", round: "2026-10-16" }),
    ).toThrow("No round on 2026-10-16 in 2026-10");
  });
});
