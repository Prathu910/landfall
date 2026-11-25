/**
 * `npm run social:render -- --month YYYY-MM --set round|month`: renders a
 * set's Instagram cards in headless Chrome (puppeteer-core) to
 * `public/social/` (spec 6.7). Each card is checked in the page first
 * (browser-checks.ts); one failure renders nothing and exits 1. Each PNG is
 * quantised (compress.ts); an image or set over its size limit also writes
 * nothing and exits 1. A `set.json` manifest is written beside the images. With
 * `--html-only <dir>` it writes each card's HTML there instead, for a preview.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { loadRecap } from "../../src/lib/updates/load-server";
import type { RecapFacts } from "../../src/lib/updates/types";
import { checkLimits, quantise } from "./compress";
import { checkCard } from "./browser-checks";
import { CARD_SIZES, cardHtml, writeCardHtml } from "./html";
import {
  jobsFor,
  parseRenderArgs,
  manifestPath,
  reusedRoundFiles,
  setManifest,
  type RenderJob,
} from "./jobs";

export const DEFAULT_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ROOT = resolve(__dirname, "..", "..");

export type CardRenderer = {
  /**
   * The job's card as a PNG, after the page checks pass. `html` replaces the
   * card's own document (tests use it to break one check).
   */
  render(job: RenderJob, html?: string): Promise<Buffer>;
  close(): Promise<void>;
};

/** One headless Chrome and one page, reused for every card. */
export async function openRenderer(
  chrome: string = process.env.CHROME_PATH ?? DEFAULT_CHROME,
): Promise<CardRenderer> {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--hide-scrollbars", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage();
  // Chrome loads the file:// fonts only for a file:// page, not about:blank.
  const dir = mkdtempSync(join(tmpdir(), "social-render-"));
  let count = 0;

  return {
    async render(job, html = cardHtml(job.card, job.format, job.theme)) {
      const { width, height } = CARD_SIZES[job.format];
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: job.theme },
      ]);
      count += 1;
      const file = join(dir, `${count}-${basename(job.out, ".png")}.html`);
      writeFileSync(file, html);
      await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
      await page.evaluate("document.fonts.ready.then(() => true)");
      await checkCard(page, job);
      const png = await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width, height },
      });
      return Buffer.from(png);
    },
    async close() {
      await browser.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

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

async function main(): Promise<void> {
  try {
    const args = parseRenderArgs(process.argv.slice(2));
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
