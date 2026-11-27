import { describe, expect, it } from "vitest";
import { PASS_MARK } from "../../data/guide/points-table";
import { enoughFaq } from "../guide/faq";
import { latestRound, type LatestRound } from "../updates/latest-round";
import { loadRecap } from "../updates/load-server";
import { captionText } from "./captions";
import { enoughSentences } from "./enough-post";
import { ENOUGH_TIMES, enoughReel } from "./enough-reel";
import {
  ENTER_MS,
  EXIT_MS,
  GROW_MS,
  countAt,
  cutTrack,
  fadeTrack,
} from "./reel-motion";
import { reelCaptionMarkdown, sceneText } from "./reel-text";
import type { Reel, ReelScene } from "./reel-types";

/** The reel on the frozen 2026-10 recap: the 15 Oct 2026 round. */
const recap = loadRecap("2026-10");
const round = latestRound([recap]) as LatestRound;
const section = recap.rounds[round.date];
const reel = enoughReel({ round, section, passMark: PASS_MARK });

const scene = <K extends ReelScene["kind"]>(kind: K) =>
  reel.scenes.find((s) => s.kind === kind) as Extract<ReelScene, { kind: K }>;

/** Every `anim` a scene names, so each one's track can be found. */
function anims(r: Reel): string[] {
  const names = [r.topAnim];
  for (const s of r.scenes) {
    switch (s.kind) {
      case "hook":
        names.push(s.title.anim, s.sub.anim, s.stamp.anim);
        break;
      case "chart":
        names.push(s.eyebrow.anim, s.title.anim, s.heading.anim, s.chartAnim);
        names.push(...s.bars.flatMap((b) => [b.anim, b.valueAnim]));
        names.push(s.axis.anim);
        break;
      case "reading":
        names.push(s.eyebrow.anim, s.title.anim, s.lead.anim, s.emphasis.anim);
        break;
      case "link":
        names.push(s.eyebrow.anim, s.title.anim, s.sub.anim, s.label.anim);
        break;
      case "end":
        names.push(s.anim, s.stamp.anim);
        break;
    }
  }
  return names;
}

describe("the 'Is 65 points enough?' reel", () => {
  it("is a 15 s, 30 fps, 1080x1920 reel named after the pass mark", () => {
    expect(reel).toMatchObject({
      slug: "reel-is-65-enough",
      width: 1080,
      height: 1920,
      fps: 30,
      durationMs: 15_000,
      tag: "Is 65 enough?",
      source: "Source: Home Affairs invitation round, 15 Oct 2026",
    });
    expect(reel.mrz).toMatch(/^P<AUSMIGRATELENS<<IS<65<ENOUGH<+$/);
    expect(reel.mrz).toHaveLength(44);
  });

  it("follows the storyboard's five scenes, each leaving before the next enters", () => {
    expect(reel.scenes.map((s) => s.kind)).toEqual([
      "hook",
      "chart",
      "reading",
      "link",
      "end",
    ]);
    expect(reel.scenes.map((s) => [s.inMs, s.outMs])).toEqual([
      [null, 1_700],
      [2_000, 6_700],
      [7_000, 9_700],
      [10_000, 12_200],
      [12_500, null],
    ]);
    for (let i = 1; i < reel.scenes.length; i += 1) {
      expect(reel.scenes[i].inMs).toBe(
        (reel.scenes[i - 1].outMs as number) + EXIT_MS,
      );
    }
    for (const s of reel.scenes) {
      expect(s.holdMs).toBeGreaterThanOrEqual(s.inMs ?? 0);
      expect(s.holdMs).toBeLessThanOrEqual(s.outMs ?? reel.durationMs);
    }
  });

  it("holds the end card, stamp included, for at least 2 s", () => {
    const end = scene("end");
    expect(end.outMs).toBeNull();
    expect(
      reel.durationMs - (end.inMs as number) - ENTER_MS,
    ).toBeGreaterThanOrEqual(2_000);
    expect(reel.durationMs - end.holdMs).toBeGreaterThanOrEqual(1_900);
  });

  it("keeps every move between 300 and 600 ms", () => {
    for (const ms of [ENTER_MS, EXIT_MS, GROW_MS]) {
      expect(ms).toBeGreaterThanOrEqual(300);
      expect(ms).toBeLessThanOrEqual(600);
    }
  });

  it("opens on the site's question, already on screen in the first frame", () => {
    const hook = scene("hook");
    expect(hook.title.lines.join(" ")).toBe(enoughFaq(round).question);
    expect(hook.title.lines.join(" ")).toBe(
      "Is 65 points enough for Australian PR?",
    );
    expect(hook.sub.text).toBe("What the 15 Oct 2026 189 round shows.");
    const title = reel.tracks.find((t) => t.target === hook.title.anim);
    expect(title?.keyframes[0]).toMatchObject({ offset: 0, opacity: 1 });
    expect(reel.coverMs).toBeGreaterThanOrEqual(hook.holdMs);
    expect(reel.coverMs).toBeLessThan(ENOUGH_TIMES.hook.outMs);
  });

  it("shows the round's eight bars with the 65 bar strong, counting up as each grows", () => {
    const chart = scene("chart");
    expect(chart.eyebrow.text).toBe("189 round · 15 Oct 2026");
    expect(chart.title.text).toBe("44 occupations were invited at 65");
    expect(chart.bars.map((b) => [b.label, b.value])).toEqual([
      ["65", "44"],
      ["70", "36"],
      ["75", "9"],
      ["80", "36"],
      ["85", "19"],
      ["90", "10"],
      ["95", "3"],
      ["100", "2"],
    ]);
    expect(chart.bars.filter((b) => b.strong).map((b) => b.label)).toEqual([
      "65",
    ]);
    expect(chart.bars[0].share).toBe(1);
    expect(chart.bars[7].share).toBeCloseTo(2 / 44);
    const starts = chart.bars.map((b) => {
      const grow = reel.tracks.find((t) => t.target === b.anim);
      const count = reel.counts.find((c) => c.target === b.count);
      expect(count?.to).toBe(Number(b.value));
      expect(count?.text).toBe(b.value);
      expect(count?.durationMs).toBe(GROW_MS);
      // The bar leaves scaleY(0) when its count starts.
      const start = grow?.keyframes.find((k) => k.easing)?.offset;
      expect(start).toBeCloseTo(
        (count?.startMs as number) / reel.durationMs,
        5,
      );
      return count?.startMs as number;
    });
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(starts[0]).toBeGreaterThanOrEqual(2_000);
    expect(starts[7] + GROW_MS).toBeLessThanOrEqual(chart.holdMs);
  });

  it("reads the cut-offs and the pass mark in the site's words", () => {
    const reading = scene("reading");
    expect(reading.title.text).toBe("Each occupation has its own cut-off");
    expect(reading.lead.text).toBe(
      "In this round they ran from 65 to 100 points.",
    );
    expect(reading.emphasis.text).toBe(enoughSentences(round)[0]);
    expect(reading.emphasis.text).toBe(
      "65 points is the pass mark to be invited, not a promise of an invitation.",
    );
  });

  it("points to the cut-offs page and ends on the closing card's call to action", () => {
    const link = scene("link");
    expect(link.title.text).toBe("Check your occupation's cut-off");
    expect(link.url).toBe("migratelens.com/occupations/189-cut-offs/");
    const end = scene("end");
    expect(end).toMatchObject({
      title: "Check your points free",
      url: "migratelens.com",
      handle: "@migratelens",
      disclaimer: "General information, not migration advice.",
    });
    expect(end.stamp.stamp.word).toBe("FREE POINTS CHECK");
  });

  it("gives every named element exactly one track, inside the reel", () => {
    const names = anims(reel);
    expect(new Set(names).size).toBe(names.length);
    expect(reel.tracks.map((t) => t.target).sort()).toEqual([...names].sort());
    for (const track of reel.tracks) {
      const offsets = track.keyframes.map((k) => k.offset);
      expect(offsets[0]).toBe(0);
      expect(offsets[offsets.length - 1]).toBe(1);
      expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    }
  });

  it("never tweens a stamp: it appears and goes with hard cuts", () => {
    for (const target of [scene("hook").stamp.anim, scene("end").stamp.anim]) {
      const { keyframes } = reel.tracks.find((t) => t.target === target)!;
      for (const k of keyframes) expect(k.transform).toBeUndefined();
      for (let i = 1; i < keyframes.length; i += 1) {
        if (keyframes[i].opacity !== keyframes[i - 1].opacity) {
          expect(keyframes[i].offset).toBe(keyframes[i - 1].offset);
        }
      }
    }
    // The end card's stamp arrives once the card has settled.
    const end = scene("end");
    const stamp = reel.tracks.find((t) => t.target === end.stamp.anim)!;
    const on = stamp.keyframes.find((k) => k.opacity === 1)!;
    expect(on.offset * reel.durationMs).toBeCloseTo(
      (end.inMs as number) + ENTER_MS,
      1,
    );
  });

  it("writes caption.md with the post 7 caption and every scene's words", () => {
    const md = reelCaptionMarkdown(reel);
    expect(md).toContain(captionText(reel.caption));
    expect(reel.caption.hook).toBe("Is 65 points enough for Australian PR?");
    expect(md).toContain("`reel-is-65-enough.mp4`: 1080x1920, 30 fps, 15 s");
    expect(md).toContain("- 2.0 s to 7.0 s: 189 round · 15 Oct 2026.");
    expect(sceneText(scene("chart"))).toContain("65: 44; 70: 36");
  });
});

describe("reel motion", () => {
  it("fades a line in and out over the whole reel", () => {
    expect(fadeTrack("a", 1_000, 2_000, 10_000).keyframes).toEqual([
      { offset: 0, opacity: 0, transform: "translateY(32px)" },
      {
        offset: 0.1,
        opacity: 0,
        transform: "translateY(32px)",
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
      },
      { offset: 0.15, opacity: 1, transform: "translateY(0px)" },
      {
        offset: 0.2,
        opacity: 1,
        transform: "translateY(0px)",
        easing: "cubic-bezier(0.33, 1, 0.68, 1)",
      },
      { offset: 0.23, opacity: 0, transform: "translateY(-24px)" },
      { offset: 1, opacity: 0, transform: "translateY(-24px)" },
    ]);
  });

  it("keeps a move's easing when it starts at 0 ms, and a cut's two keyframes", () => {
    const fade = fadeTrack("a", 0, null, 10_000).keyframes;
    expect(fade[0]).toMatchObject({
      offset: 0,
      opacity: 0,
      easing: expect.any(String),
    });
    expect(cutTrack("s", 0, 5_000, 10_000).keyframes).toEqual([
      { offset: 0, opacity: 0 },
      { offset: 0, opacity: 1 },
      { offset: 0.5, opacity: 1 },
      { offset: 0.5, opacity: 0 },
      { offset: 1, opacity: 0 },
    ]);
  });

  it("refuses a time outside the reel", () => {
    expect(() => fadeTrack("a", 9_800, null, 10_000)).toThrow(/outside/);
  });

  it("counts up with ease-out and lands on the published text", () => {
    const count = {
      target: "c",
      startMs: 1_000,
      durationMs: 600,
      to: 44,
      text: "44",
    };
    expect(countAt(count, 0)).toBe("0");
    expect(countAt(count, 1_000)).toBe("0");
    expect(Number(countAt(count, 1_300))).toBeGreaterThan(22);
    expect(countAt(count, 1_600)).toBe("44");
    const values = [1_000, 1_100, 1_200, 1_300, 1_400, 1_500].map((ms) =>
      Number(countAt(count, ms)),
    );
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});
