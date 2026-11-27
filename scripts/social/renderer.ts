/**
 * One headless Chrome (puppeteer-core) and one page that render a card's
 * HTML to a PNG after its page checks pass (browser-checks.ts). Shared by
 * the monthly sets (render.ts) and the launch pack (launch.ts).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { checkCard } from "./browser-checks";
import { CARD_SIZES, cardHtml, type HtmlJob } from "./html";

export const DEFAULT_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export type CardRenderer = {
  /**
   * The job's card as a PNG, after the page checks pass. `html` replaces the
   * card's own document (tests use it to break one check).
   */
  render(job: HtmlJob, html?: string): Promise<Buffer>;
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
