/**
 * `npm run social:render -- --month YYYY-MM --set round|month`: renders a
 * set's Instagram cards in headless Chrome (puppeteer-core) to
 * `public/social/` (spec 6.7). Each card is checked in the page first
 * (browser-checks.ts); one failure renders nothing and exits 1. Each PNG is
 * quantised (compress.ts); an image or set over its size limit also writes
 * nothing and exits 1. A `set.json` manifest is written beside the images. With
 * `--html-only <dir>` it writes each card's HTML there instead, for a preview.
 * `--set launch` renders the Instagram launch pack instead (launch.ts).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { loadRecap } from "../../src/lib/updates/load-server";
import type { RecapFacts } from "../../src/lib/updates/types";
import { checkLimits, quantise } from "./compress";
import { writeCardHtml } from "./html";
import {
  jobsFor,
  parseRenderArgs,
  manifestPath,
  reusedRoundFiles,
  setManifest,
  type RenderJob,
} from "./jobs";

import { runLaunch } from "./launch";
import { openRenderer } from "./renderer";

export { DEFAULT_CHROME, openRenderer, type CardRenderer } from "./renderer";

const ROOT = resolve(__dirname, "..", "..");

/** Every job's compressed PNG, in order; throws on the first card that fails a check. */
async function renderAll(jobs: RenderJob[]): Promise<Buffer[]> {
  const renderer = await openRenderer();
  try {
    const pngs: Buffer[] = [];
    for (const job of jobs) {
      pngs.push(await quantise(await renderer.render(job)));
    }
    return pngs;
  } finally {
    await renderer.close();
  }
}

/** R13: the month set reuses the round set's card 2, so it must exist. */
function requireReusedFiles(facts: RecapFacts): void {
  const missing = reusedRoundFiles(facts).filter(
    (file) => !existsSync(join(ROOT, file)),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(", ")}; render the round set first: npm run social:render -- --month ${facts.month} --set round`,
    );
  }
}

/** `--set launch` is the launch pack (launch.ts), with its own flags. */
const isLaunch = (argv: string[]) =>
  argv.some((flag, i) => flag === "--set" && argv[i + 1] === "launch");

async function main(): Promise<void> {
  try {
    const argv = process.argv.slice(2);
    if (isLaunch(argv)) {
      await runLaunch(argv);
      return;
    }
    const args = parseRenderArgs(argv);
    const facts = loadRecap(args.month);
    const jobs = jobsFor(facts, args);
    if (args.htmlOnly) {
      const files = writeCardHtml(jobs, resolve(args.htmlOnly));
      console.log(`Wrote ${files.length} HTML files to ${args.htmlOnly}`);
      return;
    }
    if (args.set === "month") requireReusedFiles(facts);
    const pngs = await renderAll(jobs);
    const problems = checkLimits(
      jobs.map((job, i) => ({ path: job.out, bytes: pngs[i].length })),
    );
    if (problems.length > 0) throw new Error(problems.join("\n"));
    jobs.forEach((job, i) => {
      const file = join(ROOT, job.out);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, pngs[i]);
      console.log(`Wrote ${job.out}`);
    });
    const manifest = manifestPath(jobs);
    writeFileSync(
      join(ROOT, manifest),
      `${JSON.stringify(setManifest(facts, args, jobs), null, 2)}\n`,
    );
    console.log(`Wrote ${manifest}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

// tsx runs this file as CommonJS; tests import it without running.
if (process.argv[1]?.endsWith(join("social", "render.ts"))) void main();
