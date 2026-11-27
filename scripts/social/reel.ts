/**
 * `npm run social:reel -- --reel enough --out <dir>`: renders an Instagram
 * reel (reel brief 2026-11-27) as a silent 1080x1920 H.264 MP4. Headless
 * Chrome (puppeteer-core) opens the reel page, checks its still layout and
 * each scene's seconds, then seeks and screenshots every frame (30 fps) to a
 * temporary folder; `encode-mp4.swift`, run with /usr/bin/swift
 * (AVFoundation, nothing installed), encodes them and probes the result.
 * Writes `<slug>.mp4`, `cover.png`, `caption.md` and `frames-check/` (the
 * frames at 1, 4, 8.5, 11.5 and 14.5 s, read back from the MP4). Any failure
 * writes nothing and exits 1. The output never goes in `public/`.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { enoughReel } from "../../src/lib/social/enough-reel";
import { loadEnoughInput } from "../../src/lib/social/load-server";
import { reelCaptionMarkdown } from "../../src/lib/social/reel-text";
import type { Reel } from "../../src/lib/social/reel-types";
import { requireOutsidePublic } from "./launch";
import { reelHtml } from "./reel-html";
import { checkReel, openReelPage, screenshot } from "./reel-browser";

const SWIFT = "/usr/bin/swift";
const ENCODER = join(__dirname, "encode-mp4.swift");
const BITRATE = 9_000_000;
const MAX_BYTES = 30 * 1024 * 1024;
/** The frames read back from the MP4 for a look (brief). */
export const CHECK_SECONDS = [1, 4, 8.5, 11.5, 14.5];

const REELS: Record<string, () => Reel> = {
  enough: () => enoughReel(loadEnoughInput()),
};

export type ReelArgs = { reel: string; out: string; htmlOnly?: string };

/** `--reel enough --out <dir> [--html-only <file>]`. */
export function parseReelArgs(argv: string[]): ReelArgs {
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]];
    if (!["--reel", "--out", "--html-only"].includes(flag)) {
      throw new Error(`Unknown flag ${flag}`);
    }
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${flag} needs a value`);
    }
    if (values.has(flag)) throw new Error(`${flag} given twice`);
    values.set(flag, value);
  }
  const reel = values.get("--reel");
  if (!reel || !(reel in REELS)) {
    throw new Error(`--reel must be one of ${Object.keys(REELS).join(", ")}`);
  }
  const out = values.get("--out");
  if (!out) throw new Error("--out <dir> is required");
  return { reel, out, htmlOnly: values.get("--html-only") };
}

/** Every frame as frame-0000.png … in `dir`/frames; returns the cover frame. */
async function renderFrames(reel: Reel, dir: string): Promise<Buffer> {
  const { browser, page } = await openReelPage(reel, dir);
  try {
    await checkReel(page, reel);
    const frames = Math.round((reel.durationMs / 1000) * reel.fps);
    for (let i = 0; i < frames; i += 1) {
      const name = `frame-${String(i).padStart(4, "0")}.png`;
      writeFileSync(
        join(dir, "frames", name),
        await screenshot(page, reel, (i * 1000) / reel.fps),
      );
      if ((i + 1) % 90 === 0) console.log(`Rendered ${i + 1}/${frames} frames`);
    }
    return await screenshot(page, reel, reel.coverMs);
  } finally {
    await browser.close();
  }
}

function swift(args: string[]): string {
  const run = spawnSync(SWIFT, [ENCODER, ...args], { encoding: "utf8" });
  if (run.status !== 0) {
    throw new Error(`swift ${args[0]} failed: ${run.stderr || run.error}`);
  }
  return run.stdout;
}

export type Probe = {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
  frames: number;
  bytes: number;
  fastStart: boolean;
};

/** What is wrong with the encoded video, if anything. */
export function probeProblems(probe: Probe, reel: Reel): string[] {
  const frames = Math.round((reel.durationMs / 1000) * reel.fps);
  const problems = [
    Math.abs(probe.duration - reel.durationMs / 1000) > 0.05 &&
      `duration ${probe.duration} s`,
    (probe.width !== reel.width || probe.height !== reel.height) &&
      `size ${probe.width}x${probe.height}`,
    probe.codec !== "avc1" && `codec ${probe.codec}, not H.264`,
    Math.abs(probe.fps - reel.fps) > 0.01 && `${probe.fps} fps`,
    probe.frames !== frames && `${probe.frames} frames, not ${frames}`,
    probe.bytes > MAX_BYTES && `${probe.bytes} bytes, over 30 MB`,
    !probe.fastStart && "the moov atom is not at the start",
  ];
  return problems.filter((p): p is string => typeof p === "string");
}

async function run(args: ReelArgs): Promise<void> {
  const out = resolve(args.out);
  requireOutsidePublic(out);
  const reel = REELS[args.reel]();
  if (args.htmlOnly) {
    writeFileSync(resolve(args.htmlOnly), reelHtml(reel));
    console.log(`Wrote ${args.htmlOnly}`);
    return;
  }
  const temp = mkdtempSync(join(tmpdir(), "social-reel-"));
  try {
    mkdirSync(join(temp, "frames"));
    const cover = await renderFrames(reel, temp);
    const video = join(temp, `${reel.slug}.mp4`);
    swift([
      "encode",
      join(temp, "frames"),
      video,
      String(reel.fps),
      String(BITRATE),
    ]);
    const probe = JSON.parse(
      swift([
        "probe",
        video,
        join(temp, "frames-check"),
        CHECK_SECONDS.join(","),
      ]),
    ) as Probe;
    const problems = probeProblems(probe, reel);
    if (problems.length > 0)
      throw new Error(`${reel.slug}.mp4: ${problems.join("; ")}`);

    mkdirSync(join(out, "frames-check"), { recursive: true });
    copyFileSync(video, join(out, `${reel.slug}.mp4`));
    for (const name of readdirSync(join(temp, "frames-check"))) {
      copyFileSync(
        join(temp, "frames-check", name),
        join(out, "frames-check", name),
      );
    }
    writeFileSync(join(out, "cover.png"), cover);
    writeFileSync(join(out, "caption.md"), reelCaptionMarkdown(reel));
    console.log(
      `Wrote ${reel.slug}.mp4 (${(probe.bytes / 1024 / 1024).toFixed(1)} MB, ${probe.duration} s, ${probe.width}x${probe.height}, ${probe.codec}, ${probe.fps} fps), cover.png, caption.md and frames-check/ to ${args.out}`,
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  try {
    await run(parseReelArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

// tsx runs this file as CommonJS; tests import it without running.
if (process.argv[1]?.endsWith(join("social", "reel.ts"))) void main();
