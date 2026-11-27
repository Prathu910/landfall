import type { CaptionParts, LaunchStamp } from "./launch-types";
import type { ReelCount, ReelTrack } from "./reel-motion";

/**
 * An Instagram reel (brief 2026-11-27): a silent 1080x1920 video of Look A
 * passport scenes, as a pure view-model. The template in
 * scripts/social/templates/reel-page.tsx only renders it, and every moving
 * element names its track by `anim`.
 */

/** A line of text and the track that moves it. */
export type ReelLine = { anim: string; text: string };

export type ReelStamp = { anim: string; stamp: LaunchStamp };

/** One column of the chart: it grows while its count ticks up. */
export type ReelBar = {
  /** The bar's grow track. */
  anim: string;
  /** The value's fade track; the count-up writes into the same element. */
  valueAnim: string;
  /** The `data-count` the page's count-up fills. */
  count: string;
  label: string;
  /** The final value, as the cards write it. */
  value: string;
  /** The bar's height as a share of the tallest bar. */
  share: number;
  /** The pass mark's bar, in the ink colour as in post 7. */
  strong: boolean;
};

type SceneTimes = {
  /** When the scene's first line starts to enter; null when it opens the reel. */
  inMs: number | null;
  /** When it starts to leave; null for the end card. */
  outMs: number | null;
  /** A time when every element of the scene is on screen, for the page checks. */
  holdMs: number;
};

export type HookScene = SceneTimes & {
  kind: "hook";
  title: { anim: string; lines: string[] };
  sub: ReelLine;
  stamp: ReelStamp;
};

export type ChartScene = SceneTimes & {
  kind: "chart";
  eyebrow: ReelLine;
  title: ReelLine;
  heading: ReelLine;
  /** The baseline and score labels, which fade in before the bars grow. */
  chartAnim: string;
  bars: ReelBar[];
  axis: ReelLine;
};

export type ReadingScene = SceneTimes & {
  kind: "reading";
  eyebrow: ReelLine;
  title: ReelLine;
  lead: ReelLine;
  emphasis: ReelLine;
};

export type LinkScene = SceneTimes & {
  kind: "link";
  eyebrow: ReelLine;
  title: ReelLine;
  sub: ReelLine;
  /** The passport label: "Visit" and the address. */
  label: ReelLine;
  url: string;
};

export type EndScene = SceneTimes & {
  kind: "end";
  /** Logo, title, address, handle and disclaimer move together. */
  anim: string;
  stamp: ReelStamp;
  title: string;
  url: string;
  handle: string;
  disclaimer: string;
};

export type ReelScene =
  HookScene | ChartScene | ReadingScene | LinkScene | EndScene;

export type Reel = {
  /** The video's file name without `.mp4`. */
  slug: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  /** The top-right tag on the passport page. */
  tag: string;
  source: string;
  mrz: string;
  /** The logo and tag row, which leaves as the end card's big logo arrives. */
  topAnim: string;
  scenes: ReelScene[];
  tracks: ReelTrack[];
  counts: ReelCount[];
  /** The frame used as the reel's cover. */
  coverMs: number;
  caption: CaptionParts;
};
