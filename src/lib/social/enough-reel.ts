import { enoughFaq } from "../guide/faq";
import { ROUND_SOURCE, closingCardFor } from "../updates/cards";
import { dayText, formatNumber } from "../updates/format";
import { cutoffSpanText } from "../updates/latest-round";
import {
  CUTOFFS_PAGE,
  CUTOFFS_URL,
  atPassMarkTitle,
  enoughCaption,
  enoughSentences,
  passMarkStamp,
  type EnoughInput,
} from "./enough-post";
import { launchMrz } from "./launch-common";
import {
  ENTER_MS,
  EXIT_MS,
  GROW_MS,
  cutTrack,
  fadeTrack,
  growTrack,
  type ReelCount,
  type ReelTrack,
} from "./reel-motion";
import type {
  ChartScene,
  EndScene,
  HookScene,
  LinkScene,
  ReadingScene,
  Reel,
  ReelLine,
} from "./reel-types";

/**
 * Reel 1, "Is 65 points enough?" (reel brief 2026-11-27, founder-approved
 * storyboard), paired with launch post 7: the hook, the round's cut-offs as
 * rising bars, the plain reading, the cut-offs page and the end card. Every
 * figure and date comes from the newest round and its recap section, and
 * the wording from post 7 and the site's "Is 65 points enough?" answer.
 */

export const REEL = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationMs: 15_000,
} as const;

/** Each scene's entry and exit (ms); a scene leaves over EXIT_MS before the next enters. */
export const ENOUGH_TIMES = {
  hook: { inMs: null, outMs: 1_700 },
  chart: { inMs: 2_000, outMs: 6_700 },
  reading: { inMs: 7_000, outMs: 9_700 },
  link: { inMs: 10_000, outMs: 12_200 },
  end: { inMs: 12_500, outMs: null },
} as const;

/** The gap between lines entering one after another. */
const STAGGER_MS = 120;
/** The first bar starts to grow, and each next one this much later. */
const BARS_FROM_MS = 2_500;
const BAR_STEP_MS = 280;
/** The hook's frame used as the cover: every line is on screen. */
const COVER_MS = 1_000;

type Timeline = { tracks: ReelTrack[]; counts: ReelCount[] };

function line(
  t: Timeline,
  anim: string,
  text: string,
  inMs: number | null,
  outMs: number | null,
): ReelLine {
  t.tracks.push(fadeTrack(anim, inMs, outMs, REEL.durationMs));
  return { anim, text };
}

function hookScene(t: Timeline, input: EnoughInput): HookScene {
  const { inMs, outMs } = ENOUGH_TIMES.hook;
  const { round, passMark } = input;
  const question = enoughFaq(round).question;
  const lines = [`Is ${passMark} points`, "enough for", "Australian PR?"];
  if (lines.join(" ") !== question) {
    throw new Error(`The hook no longer matches "${question}"`);
  }
  t.tracks.push(fadeTrack("hook-title", inMs, outMs, REEL.durationMs));
  t.tracks.push(cutTrack("hook-stamp", 0, outMs + EXIT_MS, REEL.durationMs));
  return {
    kind: "hook",
    inMs,
    outMs,
    holdMs: 400 + ENTER_MS,
    title: { anim: "hook-title", lines },
    sub: line(
      t,
      "hook-sub",
      `What the ${dayText(round.date)} 189 round shows.`,
      400,
      outMs,
    ),
    stamp: { anim: "hook-stamp", stamp: passMarkStamp(round, passMark) },
  };
}

function chartScene(t: Timeline, input: EnoughInput): ChartScene {
  const { inMs, outMs } = ENOUGH_TIMES.chart;
  const { round, section, passMark } = input;
  const tallest = Math.max(
    1,
    ...section.distribution.map((d) => d.occupations),
  );
  const bars = section.distribution.map((d, i) => {
    const start = BARS_FROM_MS + i * BAR_STEP_MS;
    const value = formatNumber(d.occupations);
    t.tracks.push(growTrack(`bar-${i}`, start, REEL.durationMs));
    t.tracks.push(fadeTrack(`value-${i}`, start, outMs, REEL.durationMs));
    t.counts.push({
      target: `count-${i}`,
      startMs: start,
      durationMs: GROW_MS,
      to: d.occupations,
      text: value,
    });
    return {
      anim: `bar-${i}`,
      valueAnim: `value-${i}`,
      count: `count-${i}`,
      label: String(d.score),
      value,
      share: d.occupations / tallest,
      strong: d.score === passMark,
    };
  });
  const barsDone = BARS_FROM_MS + (bars.length - 1) * BAR_STEP_MS + GROW_MS;
  t.tracks.push(
    fadeTrack("chart", inMs + 3 * STAGGER_MS, outMs, REEL.durationMs),
  );
  return {
    kind: "chart",
    inMs,
    outMs,
    holdMs: Math.min(outMs, barsDone + ENTER_MS),
    eyebrow: line(
      t,
      "chart-eyebrow",
      `189 round · ${dayText(round.date)}`,
      inMs,
      outMs,
    ),
    title: line(
      t,
      "chart-title",
      atPassMarkTitle(section, passMark),
      inMs + STAGGER_MS,
      outMs,
    ),
    heading: line(
      t,
      "chart-heading",
      "Occupations by lowest score invited",
      inMs + 2 * STAGGER_MS,
      outMs,
    ),
    chartAnim: "chart",
    bars,
    axis: line(
      t,
      "chart-axis",
      "Lowest score invited (points)",
      barsDone,
      outMs,
    ),
  };
}

function readingScene(t: Timeline, input: EnoughInput): ReadingScene {
  const { inMs, outMs } = ENOUGH_TIMES.reading;
  const [passMarkSentence] = enoughSentences(input.round);
  const emphasisIn = inMs + 700;
  return {
    kind: "reading",
    inMs,
    outMs,
    holdMs: emphasisIn + ENTER_MS,
    eyebrow: line(t, "reading-eyebrow", "The plain reading", inMs, outMs),
    title: line(
      t,
      "reading-title",
      "Each occupation has its own cut-off",
      inMs + STAGGER_MS,
      outMs,
    ),
    lead: line(
      t,
      "reading-lead",
      `In this round they ran from ${cutoffSpanText(input.round)}.`,
      inMs + 2 * STAGGER_MS,
      outMs,
    ),
    emphasis: line(t, "reading-emphasis", passMarkSentence, emphasisIn, outMs),
  };
}

function linkScene(t: Timeline): LinkScene {
  const { inMs, outMs } = ENOUGH_TIMES.link;
  return {
    kind: "link",
    inMs,
    outMs,
    holdMs: inMs + 3 * STAGGER_MS + ENTER_MS,
    eyebrow: line(t, "link-eyebrow", "Your occupation", inMs, outMs),
    title: line(
      t,
      "link-title",
      "Check your occupation's cut-off",
      inMs + STAGGER_MS,
      outMs,
    ),
    sub: line(t, "link-sub", CUTOFFS_PAGE, inMs + 2 * STAGGER_MS, outMs),
    label: line(t, "link-label", "Visit", inMs + 3 * STAGGER_MS, outMs),
    url: CUTOFFS_URL,
  };
}

function endScene(t: Timeline, tag: string, source: string): EndScene {
  const { inMs, outMs } = ENOUGH_TIMES.end;
  const closing = closingCardFor(tag, null, source);
  const settled = inMs + ENTER_MS;
  t.tracks.push(fadeTrack("end", inMs, outMs, REEL.durationMs));
  t.tracks.push(cutTrack("end-stamp", settled, outMs, REEL.durationMs));
  return {
    kind: "end",
    inMs,
    outMs,
    holdMs: settled + 100,
    anim: "end",
    stamp: { anim: "end-stamp", stamp: { ...closing.stamp, shape: "round" } },
    title: closing.title,
    url: closing.url,
    handle: closing.handle,
    disclaimer: closing.disclaimer,
  };
}

/** The reel's scenes, tracks and caption from the newest round. */
export function enoughReel(input: EnoughInput): Reel {
  const { round, passMark } = input;
  const tag = `Is ${passMark} enough?`;
  const source = ROUND_SOURCE(round.date);
  const t: Timeline = { tracks: [], counts: [] };
  const scenes = [
    hookScene(t, input),
    chartScene(t, input),
    readingScene(t, input),
    linkScene(t),
    endScene(t, tag, source),
  ];
  t.tracks.push(
    fadeTrack("top", null, ENOUGH_TIMES.link.outMs, REEL.durationMs),
  );
  return {
    slug: `reel-is-${passMark}-enough`,
    title: `Reel: Is ${passMark} points enough?`,
    ...REEL,
    tag,
    source,
    mrz: launchMrz(["IS", String(passMark), "ENOUGH"]),
    topAnim: "top",
    scenes,
    tracks: t.tracks,
    counts: t.counts,
    coverMs: COVER_MS,
    caption: enoughCaption(round, passMark),
  };
}
