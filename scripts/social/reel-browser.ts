/**
 * A reel's page in headless Chrome (puppeteer-core): the still-layout and
 * per-scene checks, and one screenshot per frame. Used by the reel command
 * (reel.ts) and its Chrome test.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import type { Reel } from "../../src/lib/social/reel-types";
import { CARD_FONTS, checkPage, type Expected } from "./browser-checks";
import { reelHtml } from "./reel-html";
import { DEFAULT_CHROME } from "./renderer";
import { cardColour } from "./tokens";

/** Instagram's reel UI covers the top 220px, bottom 380px and right 140px. */
export const REEL_SAFE = { top: 250, bottom: 1540, left: 60, right: 940 };
/** The profile grid's 4:5 crop of a 1080x1920 cover. */
export const COVER_BAND = { top: 285, bottom: 1635 };

const expected: Expected = {
  fonts: CARD_FONTS,
  paper: cardColour("paper", "light"),
  safe: { ...REEL_SAFE, name: "reel" },
  essential: null,
  circle: null,
};

/**
 * At `ms`, every animated element of the scene in view is fully shown and
 * every other scene's is hidden (its own opacity times its parents');
 * returns the elements that aren't.
 */
function sceneVisibility(kind: string, ms: number): string {
  return `(() => {
  window.seek(${ms});
  const wrong = [];
  for (const scene of document.querySelectorAll(".scene")) {
    const mine = scene.classList.contains("scene-${kind}");
    for (const el of scene.querySelectorAll("[data-anim]")) {
      let o = 1;
      for (let at = el; at !== scene; at = at.parentElement) {
        o *= Number(getComputedStyle(at).opacity);
      }
      if (mine ? o < 0.999 : o > 0.001) wrong.push(el.dataset.anim + " " + o);
    }
  }
  return wrong;
})()`;
}

/** The cover's text inside the profile grid's crop, in the still layout. */
const coverBand = `(() => {
  const r = document.querySelector("[data-cover]").getBoundingClientRect();
  return r.top >= ${COVER_BAND.top} && r.bottom <= ${COVER_BAND.bottom}
    ? [] : ["cover text spans y " + Math.round(r.top) + "-" + Math.round(r.bottom)];
})()`;

/** The still layout, then each scene at its hold time; throws on any problem. */
export async function checkReel(page: Page, reel: Reel): Promise<void> {
  await checkPage(page, expected, `${reel.slug} (still layout)`);
  const outside = (await page.evaluate(coverBand)) as string[];
  if (outside.length > 0) throw new Error(`${reel.slug}: ${outside[0]}`);
  await page.evaluate("window.startReel()");
  for (const scene of reel.scenes) {
    const wrong = (await page.evaluate(
      sceneVisibility(scene.kind, scene.holdMs),
    )) as string[];
    if (wrong.length > 0) {
      throw new Error(
        `${reel.slug} at ${scene.holdMs} ms (${scene.kind}): ${wrong.join(", ")}`,
      );
    }
  }
}

/** The frame at `ms` as a PNG. */
export async function screenshot(
  page: Page,
  reel: Reel,
  ms: number,
): Promise<Buffer> {
  await page.evaluate(`window.seek(${ms})`);
  const png = await page.screenshot({
    type: "png",
    optimizeForSpeed: true,
    clip: { x: 0, y: 0, width: reel.width, height: reel.height },
  });
  return Buffer.from(png);
}

export type ReelPage = { browser: Browser; page: Page };

/**
 * Chrome with the reel page loaded still (`#still`), fonts ready. The page
 * file goes in `dir`: Chrome loads the file:// fonts only for a file:// page.
 */
export async function openReelPage(
  reel: Reel,
  dir: string,
  chrome: string = process.env.CHROME_PATH ?? DEFAULT_CHROME,
): Promise<ReelPage> {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--hide-scrollbars", "--force-color-profile=srgb"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: reel.width,
      height: reel.height,
      deviceScaleFactor: 1,
    });
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: "light" },
    ]);
    const file = join(dir, `${reel.slug}.html`);
    writeFileSync(file, reelHtml(reel));
    await page.goto(`${pathToFileURL(file).href}#still`, { waitUntil: "load" });
    await page.evaluate("document.fonts.ready.then(() => true)");
    return { browser, page };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
