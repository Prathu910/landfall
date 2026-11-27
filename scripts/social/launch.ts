/**
 * `npm run social:render -- --set launch --out <dir>`: the Instagram launch
 * pack (brief 2026-11-27). Renders every card with the monthly renderer and
 * its page checks, copies posts 2 and 3 from `public/social/`, checks the
 * size limits per folder, then writes each post's `caption.json`,
 * captions.md, calendar.md, profile.md, preview.html and contact.png. Any
 * failure writes nothing and exits 1. The output never goes in `public/`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { calendarMarkdown, replyExample } from "../../src/lib/social/calendar";
import {
  captionText,
  captionsMarkdown,
  slideFile,
} from "../../src/lib/social/captions";
import { buildLaunchPack } from "../../src/lib/social/launch-pack";
import type { LaunchPack } from "../../src/lib/social/launch-types";
import type { OccupationInput } from "../../src/lib/social/occupation-post";
import { loadLaunchInput } from "../../src/lib/social/load-server";
import { PROFILE_OPTIONS, profileMarkdown } from "../../src/lib/social/profile";
import { checkLimits, quantise } from "./compress";
import { contactSheet } from "./contact-sheet";
import { cardHtml, writeCardHtml } from "./html";
import {
  GUIDES_DIR,
  launchJobs,
  parseLaunchArgs,
  setOf,
  type LaunchArgs,
  type LaunchCopy,
  type LaunchJob,
} from "./launch-jobs";
import { previewHtml } from "./launch-preview";
import { openRenderer } from "./renderer";

const ROOT = resolve(__dirname, "..", "..");

/** The launch images are local only: never under `public/` (brief). */
function requireOutsidePublic(out: string): void {
  const rel = relative(join(ROOT, "public"), out);
  if (!rel.startsWith("..") && !rel.startsWith("/")) {
    throw new Error(
      `--out ${out} is inside public/; the launch pack stays local`,
    );
  }
}

async function renderJobs(jobs: LaunchJob[]): Promise<Buffer[]> {
  const renderer = await openRenderer();
  try {
    const pngs: Buffer[] = [];
    for (const job of jobs) {
      const html = cardHtml(job.card, job.format, job.theme, {
        guides: job.guides,
      });
      pngs.push(await quantise(await renderer.render(job, html)));
      console.log(`Rendered ${job.out}`);
    }
    return pngs;
  } finally {
    await renderer.close();
  }
}

/** One message per folder over 2.5 MB, and per image over 300 KB. */
function limitProblems(files: { path: string; bytes: number }[]): string[] {
  const sets = new Map<string, { path: string; bytes: number }[]>();
  for (const file of files) {
    const set = setOf(file.path);
    sets.set(set, [...(sets.get(set) ?? []), file]);
  }
  return [...sets.entries()].flatMap(([set, group]) =>
    checkLimits(group).map((problem) => `${set}: ${problem}`),
  );
}

function readCopies(copies: LaunchCopy[]): Buffer[] {
  return copies.map((copy) => {
    const from = join(ROOT, copy.from);
    if (!existsSync(from)) {
      throw new Error(`Missing ${copy.from}; render the monthly sets first`);
    }
    return readFileSync(from);
  });
}

function write(out: string, path: string, data: Buffer | string): void {
  const file = join(out, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
}

function writeText(
  out: string,
  pack: LaunchPack,
  args: LaunchArgs,
  occupation: OccupationInput,
): void {
  for (const post of pack.posts) {
    const caption = {
      post: post.slug,
      title: post.title,
      pinned: post.pinned,
      caption: captionText(post.caption),
      ...post.caption,
      images: post.slides.map((slide, i) => ({
        file: slideFile(i),
        alt: slide.alt,
      })),
    };
    write(
      out,
      `${post.slug}/caption.json`,
      `${JSON.stringify(caption, null, 2)}\n`,
    );
  }
  write(out, "captions.md", captionsMarkdown(pack));
  write(
    out,
    "calendar.md",
    calendarMarkdown(pack, args.start, replyExample(occupation)),
  );
  write(out, "profile.md", profileMarkdown());
  write(out, "preview.html", previewHtml(pack, PROFILE_OPTIONS[0]));
}

/** The contact sheet's rows: each post, then the stories, then the profile kit. */
function contactRows(out: string, pack: LaunchPack): string[][] {
  return [
    ...pack.posts.map((post) =>
      post.slides.map((_, i) => join(out, post.slug, slideFile(i))),
    ),
    pack.stories.map((story) => join(out, "stories", `${story.slug}.png`)),
    [
      join(out, "profile", "avatar.png"),
      ...pack.highlights.map((h) =>
        join(out, "profile", `highlight-${h.icon}.png`),
      ),
    ],
  ];
}

export async function runLaunch(argv: string[]): Promise<void> {
  const args = parseLaunchArgs(argv, new Date().toISOString().slice(0, 10));
  const out = resolve(args.out);
  requireOutsidePublic(out);
  const input = loadLaunchInput(args);
  const pack = buildLaunchPack(input);
  const { jobs, copies } = launchJobs(pack, args.theme, args.guides);
  if (args.htmlOnly) {
    const files = writeCardHtml(jobs, resolve(args.htmlOnly));
    console.log(`Wrote ${files.length} HTML files to ${args.htmlOnly}`);
    return;
  }
  const copied = readCopies(copies);
  const pngs = await renderJobs(jobs);
  const files = [
    ...jobs.map((job, i) => ({
      path: job.out,
      bytes: pngs[i].length,
      data: pngs[i],
    })),
    ...copies.map((copy, i) => ({
      path: copy.to,
      bytes: copied[i].length,
      data: copied[i],
    })),
  ];
  const problems = limitProblems(files);
  if (problems.length > 0) throw new Error(problems.join("\n"));
  for (const file of files) write(out, file.path, file.data);
  console.log(`Wrote ${files.length} images to ${args.out}`);
  if (args.guides) {
    console.log(`Outlined stories are in ${join(args.out, GUIDES_DIR)}`);
    return;
  }
  writeText(out, pack, args, input.occupation);
  write(out, "contact.png", await contactSheet(contactRows(out, pack)));
  console.log(
    "Wrote captions.md, calendar.md, profile.md, preview.html and contact.png",
  );
}
