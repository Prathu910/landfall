import { describe, expect, it } from "vitest";
import {
  monthPostSlides,
  roundPostSlides,
} from "../../src/lib/social/reused-posts";
import {
  avatarCard,
  highlightCards,
  launchStories,
} from "../../src/lib/social/stories";
import type { LaunchPack } from "../../src/lib/social/launch-types";
import { loadRecap } from "../../src/lib/updates/load-server";
import { monthSetJobs, reusedRoundFiles, roundSetJobs } from "./jobs";
import {
  GUIDES_DIR,
  launchJobs,
  nextDay,
  parseLaunchArgs,
  setOf,
} from "./launch-jobs";

const TODAY = "2026-11-27";

describe("parseLaunchArgs", () => {
  it("defaults to light, NSW, Registered Nurses nec and tomorrow's start", () => {
    expect(parseLaunchArgs(["--set", "launch", "--out", "x"], TODAY)).toEqual({
      out: "x",
      theme: "light",
      state: "NSW",
      occupation: "254499",
      start: "2026-11-28",
      guides: false,
    });
  });

  it("takes a state, an occupation, a theme, guides and a start", () => {
    const args = parseLaunchArgs(
      [
        "--set",
        "launch",
        "--out",
        "x",
        "--state",
        "vic",
        "--occupation",
        "261313",
        "--theme",
        "dark",
        "--guides",
        "--start",
        "2026-12-01",
      ],
      TODAY,
    );
    expect(args).toMatchObject({
      state: "VIC",
      occupation: "261313",
      theme: "dark",
      guides: true,
      start: "2026-12-01",
    });
  });

  it.each([
    [["--set", "launch"], "--out <dir> is required"],
    [
      ["--set", "launch", "--out", "x", "--state", "XX"],
      "--state must be one of",
    ],
    [["--set", "launch", "--out", "x", "--occupation", "25449"], "6-digit"],
    [["--set", "launch", "--out", "x", "--theme", "sepia"], "--theme"],
    [
      ["--set", "launch", "--out", "x", "--month", "2026-10"],
      "Unknown flag --month",
    ],
    [["--set", "launch", "--out"], "--out needs a value"],
  ])("rejects %j", (argv, message) => {
    expect(() => parseLaunchArgs(argv, TODAY)).toThrow(message);
  });

  it("rolls the start over a month end", () => {
    expect(nextDay("2026-11-30")).toBe("2026-12-01");
  });
});

const recap = loadRecap("2026-10");
const pack: LaunchPack = {
  posts: [
    {
      slug: "02-round-oct",
      title: "",
      pinned: false,
      slides: roundPostSlides(recap),
      caption: { hook: "", body: [], cta: "", link: "", hashtags: [] },
    },
    {
      slug: "03-update-oct",
      title: "",
      pinned: false,
      slides: monthPostSlides(recap),
      caption: { hook: "", body: [], cta: "", link: "", hashtags: [] },
    },
  ],
  stories: launchStories().map((s) => ({ ...s, alt: "" })),
  avatar: avatarCard(),
  highlights: highlightCards(),
};

describe("launchJobs", () => {
  it("copies posts 2 and 3 from exactly the files the monthly sets render", () => {
    const { jobs, copies } = launchJobs(pack, "light", false);
    const date = Object.keys(recap.rounds)[0];
    const rendered = new Set([
      ...roundSetJobs(recap, date).map((j) => j.out),
      ...monthSetJobs(recap).map((j) => j.out),
      ...reusedRoundFiles(recap),
    ]);
    for (const copy of copies)
      expect(rendered.has(copy.from), copy.from).toBe(true);
    expect(copies.map((c) => c.to)).toEqual([
      "02-round-oct/01.png",
      "02-round-oct/02.png",
      "02-round-oct/03.png",
      ...[1, 2, 3, 4, 5, 6].map((n) => `03-update-oct/0${n}.png`),
    ]);
    expect(jobs.map((j) => j.out)).toEqual([
      "stories/01-poll.png",
      "stories/02-quiz.png",
      "stories/03-link.png",
      "stories/04-new-post.png",
      "profile/avatar.png",
      "profile/highlight-rounds.png",
      "profile/highlight-points.png",
      "profile/highlight-states.png",
      "profile/highlight-guide.png",
    ]);
    expect(jobs.find((j) => j.out === "profile/avatar.png")?.format).toBe(
      "square",
    );
    expect(jobs.every((j) => !j.guides)).toBe(true);
  });

  it("takes the dark files for a dark pack", () => {
    const { copies } = launchJobs(pack, "dark", false);
    expect(copies.every((c) => c.from.endsWith("-dark.png"))).toBe(true);
  });

  it("renders only the outlined stories with --guides, beside the real ones", () => {
    const { jobs, copies } = launchJobs(pack, "light", true);
    expect(copies).toEqual([]);
    expect(jobs.map((j) => j.out)).toEqual(
      launchStories().map((s) => `${GUIDES_DIR}/${s.slug}.png`),
    );
    expect(jobs.every((j) => j.guides)).toBe(true);
  });

  it("groups each folder as one set for the size limit", () => {
    expect(setOf("04-points-table/03.png")).toBe("04-points-table");
    expect(setOf("profile/avatar.png")).toBe("profile");
  });
});
