import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PASS_MARK } from "../../src/data/guide/points-table";
import { enoughReel } from "../../src/lib/social/enough-reel";
import { countAt } from "../../src/lib/social/reel-motion";
import type { ChartScene, Reel } from "../../src/lib/social/reel-types";
import {
  latestRound,
  type LatestRound,
} from "../../src/lib/updates/latest-round";
import { loadRecap } from "../../src/lib/updates/load-server";
import { parseReelArgs, probeProblems, type Probe } from "./reel";
import { checkReel, openReelPage, type ReelPage } from "./reel-browser";
import { reelHtml } from "./reel-html";
import { DEFAULT_CHROME } from "./renderer";

const recap = loadRecap("2026-10");
const round = latestRound([recap]) as LatestRound;
const reel = enoughReel({
  round,
  section: recap.rounds[round.date],
  passMark: PASS_MARK,
});

describe("parseReelArgs", () => {
  it("reads the reel and the output folder", () => {
    expect(parseReelArgs(["--reel", "enough", "--out", "x"])).toEqual({
      reel: "enough",
      out: "x",
      htmlOnly: undefined,
    });
  });

  it("refuses an unknown reel, a missing --out and stray flags", () => {
    expect(() => parseReelArgs(["--reel", "other", "--out", "x"])).toThrow(
      "--reel must be one of enough",
    );
    expect(() => parseReelArgs(["--reel", "enough"])).toThrow("--out");
    expect(() => parseReelArgs(["--reel", "enough", "--set", "x"])).toThrow(
      "Unknown flag --set",
    );
    expect(() => parseReelArgs(["--reel", "--out", "x"])).toThrow(
      "--reel needs a value",
    );
  });
});

describe("probeProblems", () => {
  const good: Probe = {
    duration: 15,
    width: 1080,
    height: 1920,
    codec: "avc1",
    fps: 30,
    frames: 450,
    bytes: 5_000_000,
    fastStart: true,
  };

  it("passes a 15 s 1080x1920 H.264 at 30 fps under 30 MB", () => {
    expect(probeProblems(good, reel)).toEqual([]);
  });

  it("names everything that is off", () => {
    expect(
      probeProblems(
        {
          duration: 14,
          width: 1920,
          height: 1080,
          codec: "hvc1",
          fps: 25,
          frames: 350,
          bytes: 31 * 1024 * 1024,
          fastStart: false,
        },
        reel,
      ),
    ).toEqual([
      "duration 14 s",
      "size 1920x1080",
      "codec hvc1, not H.264",
      "25 fps",
      "350 frames, not 450",
      `${31 * 1024 * 1024} bytes, over 30 MB`,
      "the moov atom is not at the start",
    ]);
  });
});

describe("reelHtml", () => {
  it("holds every scene, the tracks and a seek player", () => {
    const html = reelHtml(reel);
    for (const kind of ["hook", "chart", "reading", "link", "end"])
      expect(html).toContain(`scene scene-${kind}`);
    expect(html).toContain('id="reel-data"');
    expect(html).toContain("window.seek = (ms)");
    expect(html).toContain("44 occupations were invited at 65");
    expect(html).not.toMatch(/<script[^>]* src=/);
  });
});

const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;
const SLOW = 60_000;

describe.skipIf(!existsSync(chrome))("the reel in Chrome", () => {
  let open: ReelPage;
  let dir: string;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "reel-test-"));
    open = await openReelPage(reel, dir, chrome);
  }, SLOW);
  afterAll(async () => {
    await open?.browser.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it(
    "passes the still-layout and per-scene checks",
    async () => {
      await checkReel(open.page, reel);
    },
    SLOW,
  );

  it(
    "counts up as the page's model says, and lands on the published values",
    async () => {
      const chart = reel.scenes[1] as ChartScene;
      const text = async (ms: number) =>
        open.page.evaluate(
          `window.seek(${ms}) && [...document.querySelectorAll("[data-count]")].map((e) => e.textContent)`,
        ) as Promise<string[]>;
      const mid = reel.counts[0].startMs + 200;
      expect((await text(mid))[0]).toBe(countAt(reel.counts[0], mid));
      expect(await text(chart.holdMs)).toEqual(chart.bars.map((b) => b.value));
    },
    SLOW,
  );

  it(
    "fails a reel whose text runs outside the safe area",
    async () => {
      const long: Reel = {
        ...reel,
        slug: "reel-too-long",
        scenes: reel.scenes.map((s) =>
          s.kind === "reading"
            ? { ...s, lead: { ...s.lead, text: "Too long. ".repeat(60) } }
            : s,
        ),
      };
      const bad = await openReelPage(long, dir, chrome);
      try {
        await expect(checkReel(bad.page, long)).rejects.toThrow(
          /reel-too-long \(still layout\): text overflows \.scene\.scene-reading/,
        );
      } finally {
        await bad.browser.close();
      }
    },
    SLOW,
  );
});
