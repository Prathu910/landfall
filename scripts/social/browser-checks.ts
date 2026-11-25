/**
 * What a card page must pass in Chrome before it is screenshotted: both faces
 * loaded, no text overflowing, story content inside Instagram's safe zone,
 * feed cover text inside the profile-grid crop, and the theme's own paper.
 * Any failure throws with the job's output path.
 */
import type { Page } from "puppeteer-core";
import {
  FEED,
  FEED_GRID_WIDTH,
  STORY,
} from "../../src/lib/updates/social-spec";
import type { RenderJob } from "./jobs";
import { cardColour } from "./tokens";

/** Every face and weight the cards set, by the family names html.ts declares. */
export const CARD_FONTS = [
  `900 40px "Big Shoulders Stencil Display"`,
  `400 40px "Archivo"`,
  `700 40px "Archivo"`,
  `800 40px "Archivo"`,
];

/** The story band that may hold text or a stamp. */
export const STORY_SAFE = {
  top: STORY.safeTop,
  bottom: STORY.height - STORY.safeBottom,
} as const;

/** The central band of a feed card the profile grid keeps. */
export const FEED_GRID = {
  left: (FEED.width - FEED_GRID_WIDTH) / 2,
  right: (FEED.width + FEED_GRID_WIDTH) / 2,
} as const;

type Expected = {
  fonts: string[];
  paper: string;
  safe: { top: number; bottom: number } | null;
  essential: { left: number; right: number } | null;
};

const isFeedCover = (job: RenderJob) =>
  job.format === "feed" &&
  (job.card.id === "cover" || job.card.id === "round-cover");

function expected(job: RenderJob): Expected {
  return {
    fonts: CARD_FONTS,
    paper: cardColour("paper", job.theme),
    safe: job.format === "story" ? STORY_SAFE : null,
    essential: isFeedCover(job) ? FEED_GRID : null,
  };
}

/**
 * The checks as page source returning a list of problems. A string, not a
 * function: tsx adds helpers (`__name`) to functions that the page lacks.
 * `fonts.load` first, so a face the card doesn't happen to use is still
 * checked, and an empty match (no such face declared) counts as a failure.
 */
function pageChecks(expect: Expected): string {
  return `(async (expect) => {
  const problems = [];
  const px = (n) => Math.round(n);
  for (const font of expect.fonts) {
    const faces = await document.fonts.load(font).catch(() => []);
    if (faces.length === 0 || !document.fonts.check(font)) {
      problems.push("font " + font + " did not load");
    }
  }
  for (const el of document.querySelectorAll(".fit, .inner")) {
    if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
      problems.push(
        "text overflows ." + el.className.split(" ").join(".") +
        " (" + el.scrollWidth + "x" + el.scrollHeight + " in " +
        el.clientWidth + "x" + el.clientHeight + ")"
      );
    }
  }
  if (expect.safe) {
    const boxes = [...document.querySelectorAll("[data-safe]")];
    if (boxes.length === 0) problems.push("story has no [data-safe] box");
    for (const box of boxes) {
      const r = box.getBoundingClientRect();
      if (px(r.top) < expect.safe.top || px(r.bottom) > expect.safe.bottom) {
        problems.push(
          "story content spans y " + px(r.top) + "-" + px(r.bottom) +
          ", outside the safe zone " + expect.safe.top + "-" + expect.safe.bottom
        );
      }
    }
  }
  if (expect.essential) {
    const boxes = [...document.querySelectorAll("[data-essential]")];
    if (boxes.length === 0) problems.push("feed cover has no [data-essential] box");
    for (const box of boxes) {
      const r = box.getBoundingClientRect();
      if (px(r.left) < expect.essential.left || px(r.right) > expect.essential.right) {
        problems.push(
          "cover text spans x " + px(r.left) + "-" + px(r.right) +
          ", outside the grid crop " + expect.essential.left + "-" + expect.essential.right
        );
      }
    }
  }
  const paper = getComputedStyle(document.documentElement)
    .getPropertyValue("--paper").trim();
  if (paper.toLowerCase() !== expect.paper.toLowerCase()) {
    problems.push("--paper is " + (paper || "unset") + ", not " + expect.paper);
  }
  return problems;
})(${JSON.stringify(expect)})`;
}

/** Runs the checks on the loaded card; throws naming `job.out` on any failure. */
export async function checkCard(page: Page, job: RenderJob): Promise<void> {
  const problems = (await page.evaluate(pageChecks(expected(job)))) as string[];
  if (problems.length > 0) {
    throw new Error(`${job.out}: ${problems.join("; ")}`);
  }
}
