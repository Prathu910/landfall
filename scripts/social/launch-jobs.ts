/**
 * The launch pack's images and where they go (brief 2026-11-27), relative
 * to the `--out` folder: one folder per post with its slides as 01.png,
 * 02.png …, `stories/` and `profile/`. Posts 2 and 3 copy the monthly
 * sets' PNGs instead of rendering.
 */
import type { StateCode } from "../../src/lib/data/types";
import { slideFile } from "../../src/lib/social/captions";
import type { LaunchPack } from "../../src/lib/social/launch-types";
import { STATE_CODES } from "../../src/lib/state-outlook/context";
import type { HtmlJob, Theme } from "./html";

export type LaunchArgs = {
  out: string;
  theme: Theme;
  state: StateCode;
  occupation: string;
  /** The calendar's first day, YYYY-MM-DD. */
  start: string;
  /** Render only the stories, with their sticker spaces outlined. */
  guides: boolean;
  htmlOnly?: string;
};

/** A launch image: the card job, plus whether its sticker space is outlined. */
export type LaunchJob = HtmlJob & { guides: boolean };

/** A reused PNG, copied from the repo into the pack. */
export type LaunchCopy = { from: string; to: string };

/** Where `--guides` writes the outlined stories, beside the real ones. */
export const GUIDES_DIR = "stories-guides";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CODE = /^\d{6}$/;
const FLAGS = new Set([
  "--set",
  "--out",
  "--theme",
  "--state",
  "--occupation",
  "--start",
  "--html-only",
]);
const SWITCHES = new Set(["--guides"]);

/** The day after `today` (YYYY-MM-DD). */
export function nextDay(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * `--set launch --out <dir> [--theme light|dark] [--state NSW]
 * [--occupation 254499] [--start YYYY-MM-DD] [--guides] [--html-only <dir>]`.
 */
export function parseLaunchArgs(argv: string[], today: string): LaunchArgs {
  const values = new Map<string, string>();
  let guides = false;
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (SWITCHES.has(flag)) {
      guides = true;
      continue;
    }
    if (!FLAGS.has(flag)) throw new Error(`Unknown flag ${flag}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} needs a value`);
    }
    if (values.has(flag)) throw new Error(`${flag} given twice`);
    values.set(flag, value);
    i += 1;
  }
  if (values.get("--set") !== "launch") throw new Error("--set must be launch");
  const out = values.get("--out");
  if (!out) throw new Error("--out <dir> is required");
  const theme = values.get("--theme") ?? "light";
  if (theme !== "light" && theme !== "dark") {
    throw new Error("--theme must be light or dark");
  }
  const state = (values.get("--state") ?? "NSW").toUpperCase();
  if (!STATE_CODES.includes(state as StateCode)) {
    throw new Error(`--state must be one of ${STATE_CODES.join(", ")}`);
  }
  const occupation = values.get("--occupation") ?? "254499";
  if (!CODE.test(occupation))
    throw new Error("--occupation must be a 6-digit ANZSCO code");
  const start = values.get("--start") ?? nextDay(today);
  if (!DATE.test(start)) throw new Error("--start must be YYYY-MM-DD");
  const htmlOnly = values.get("--html-only");
  return {
    out,
    theme,
    state: state as StateCode,
    occupation,
    start,
    guides,
    ...(htmlOnly === undefined ? {} : { htmlOnly }),
  };
}

/** Every rendered image and every copied one, for one theme. */
export function launchJobs(
  pack: LaunchPack,
  theme: Theme,
  guides: boolean,
): { jobs: LaunchJob[]; copies: LaunchCopy[] } {
  const stories = pack.stories.map((story) => ({
    card: story.card,
    format: "story" as const,
    theme,
    guides,
    out: `${guides ? GUIDES_DIR : "stories"}/${story.slug}.png`,
  }));
  if (guides) return { jobs: stories, copies: [] };
  const jobs: LaunchJob[] = [];
  const copies: LaunchCopy[] = [];
  for (const post of pack.posts) {
    post.slides.forEach((slide, i) => {
      const out = `${post.slug}/${slideFile(i)}`;
      if (slide.kind === "reused")
        copies.push({ from: slide.files[theme], to: out });
      else jobs.push({ card: slide.card, format: "feed", theme, guides, out });
    });
  }
  const profile: LaunchJob[] = [
    {
      card: pack.avatar,
      format: "square",
      theme,
      guides,
      out: "profile/avatar.png",
    },
    ...pack.highlights.map((card) => ({
      card,
      format: "story" as const,
      theme,
      guides,
      out: `profile/highlight-${card.icon}.png`,
    })),
  ];
  return { jobs: [...jobs, ...stories, ...profile], copies };
}

/** The limit groups: each post folder, `stories/` and `profile/` is one set. */
export function setOf(path: string): string {
  return path.slice(0, path.indexOf("/"));
}
