/**
 * One Instagram card as a complete HTML document: the two bundled faces by
 * `file://` URL, the theme's tokens, card.css and the card's static markup.
 * The renderer (render.ts) opens it in headless Chrome; `--html-only` writes
 * it to disk for a browser preview.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { CardView } from "../../src/lib/updates/cards";
import { FEED, OG, STORY } from "../../src/lib/updates/social-spec";
import type { CardFormat } from "./templates/card-page";
import { ClosingCard } from "./templates/closing-card";
import { CoverCard } from "./templates/cover-card";
import { RoundCard } from "./templates/round-card";
import { SpotlightCard } from "./templates/spotlight-card";
import { StateCard } from "./templates/state-card";
import { cardTokenCss, type Theme } from "./tokens";

export type { CardFormat, Theme };

/** What `--html-only` writes: the same fields as a render job. */
export type HtmlJob = {
  card: CardView;
  format: CardFormat;
  theme: Theme;
  /** The PNG path the job renders to; the HTML file takes its base name. */
  out: string;
};

const ROOT = resolve(__dirname, "..", "..");
/** Each format's canvas in CSS px (device scale 1). */
export const CARD_SIZES: Record<CardFormat, { width: number; height: number }> =
  {
    feed: FEED,
    story: STORY,
    og: OG,
  };

function fontUrl(path: string): string {
  return pathToFileURL(join(ROOT, "node_modules", path)).href;
}

/** The two faces the cards use, named as the renderer's font checks name them. */
const FONT_FACES = [
  `@font-face{font-family:"Archivo";src:url("${fontUrl("@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2")}") format("woff2");font-weight:100 900;font-stretch:62% 125%;font-style:normal;}`,
  `@font-face{font-family:"Big Shoulders Stencil Display";src:url("${fontUrl("@fontsource/big-shoulders-stencil-display/files/big-shoulders-stencil-display-latin-900-normal.woff2")}") format("woff2");font-weight:900;font-style:normal;}`,
].join("\n");

const CARD_CSS = readFileSync(join(__dirname, "card.css"), "utf8");

function template(card: CardView, format: CardFormat): ReactElement {
  switch (card.id) {
    case "cover":
    case "round-cover":
      return createElement(CoverCard, { card, format });
    case "round":
      return createElement(RoundCard, { card, format });
    case "state-190":
    case "state-491":
      return createElement(StateCard, { card, format });
    case "spotlight":
      return createElement(SpotlightCard, { card, format });
    case "closing":
      return createElement(ClosingCard, { card, format });
  }
}

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A full document for one card, format and theme. */
export function cardHtml(
  card: CardView,
  format: CardFormat,
  theme: Theme,
): string {
  const { width, height } = CARD_SIZES[format];
  const size = `width:${width}px;height:${height}px`;
  const body = renderToStaticMarkup(template(card, format));
  return [
    "<!doctype html>",
    `<html lang="en-AU" data-theme="${theme}">`,
    "<head>",
    '<meta charset="utf-8">',
    `<title>${escapeText(`${card.id} ${format} ${theme}`)}</title>`,
    `<style>\n${FONT_FACES}\n${cardTokenCss(theme)}\n${CARD_CSS}</style>`,
    "</head>",
    `<body style="${size}">`,
    `<div class="frame ${format}" style="${size}">${body}</div>`,
    "</body>",
    "</html>",
  ].join("\n");
}

/** Writes each job's document as `<dir>/<name>.html`; returns the paths. */
export function writeCardHtml(jobs: HtmlJob[], dir: string): string[] {
  mkdirSync(dir, { recursive: true });
  return jobs.map((job) => {
    const file = join(dir, basename(job.out).replace(/\.png$/, ".html"));
    writeFileSync(file, cardHtml(job.card, job.format, job.theme));
    return file;
  });
}
