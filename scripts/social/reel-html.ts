/**
 * A reel as one HTML document: the cards' faces, tokens and CSS plus
 * reel.css, every scene's markup, and a script that plays each element's
 * Web Animations track paused. `window.seek(ms)` sets every animation's
 * `currentTime` and the count-up numbers, so a frame depends only on its
 * time and the renderer can step through it deterministically. Opened with
 * `#still`, the page waits for `startReel()`, so the renderer can first
 * check the still layout, every scene in place and nothing moved.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Reel } from "../../src/lib/social/reel-types";
import { CARD_CSS, FONT_FACES } from "./html";
import { ReelPage } from "./templates/reel-page";
import { cardTokenCss, type Theme } from "./tokens";

const REEL_CSS = readFileSync(join(__dirname, "reel.css"), "utf8");

/**
 * The player, as page source: no helpers from tsx. The count-up curve is
 * `countAt` in reel-motion.ts (ease-out cubic), which the tests compare.
 */
const PLAYER = `window.startReel = () => {
  const data = JSON.parse(document.getElementById("reel-data").textContent);
  for (const track of data.tracks) {
    const els = document.querySelectorAll('[data-anim="' + track.target + '"]');
    if (els.length === 0) throw new Error("No element for track " + track.target);
    for (const el of els) {
      el.animate(track.keyframes, { duration: data.durationMs, fill: "both" }).pause();
    }
  }
  const counts = data.counts.map((c) => {
    const el = document.querySelector('[data-count="' + c.target + '"]');
    if (!el) throw new Error("No element for count " + c.target);
    return { ...c, el };
  });
  window.seek = (ms) => {
    for (const animation of document.getAnimations()) animation.currentTime = ms;
    for (const c of counts) {
      const p = Math.min(1, Math.max(0, (ms - c.startMs) / c.durationMs));
      c.el.textContent = p >= 1 ? c.text : String(Math.round(c.to * (1 - Math.pow(1 - p, 3))));
    }
    return ms;
  };
  window.seek(0);
};
if (location.hash !== "#still") window.startReel();`;

/** JSON safe inside a `<script>` element. */
const scriptJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

export function reelHtml(reel: Reel, theme: Theme = "light"): string {
  const size = `width:${reel.width}px;height:${reel.height}px`;
  const body = renderToStaticMarkup(createElement(ReelPage, { reel }));
  const data = {
    durationMs: reel.durationMs,
    tracks: reel.tracks,
    counts: reel.counts,
  };
  return [
    "<!doctype html>",
    `<html lang="en-AU" data-theme="${theme}">`,
    "<head>",
    '<meta charset="utf-8">',
    `<title>${reel.slug}</title>`,
    `<style>\n${FONT_FACES}\n${cardTokenCss(theme)}\n${CARD_CSS}\n${REEL_CSS}</style>`,
    "</head>",
    `<body style="${size}">`,
    `<div class="frame reel" style="${size}">${body}</div>`,
    `<script type="application/json" id="reel-data">${scriptJson(data)}</script>`,
    `<script>${PLAYER}</script>`,
    "</body>",
    "</html>",
  ].join("\n");
}
