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
import type { LaunchCard } from "../../src/lib/social/launch-types";
import type { CardView } from "../../src/lib/updates/cards";
import { FEED, OG, SQUARE, STORY } from "../../src/lib/updates/social-spec";
import type { CardFormat } from "./templates/card-page";
import { ClosingCard } from "./templates/closing-card";
import { CoverCard } from "./templates/cover-card";
import { RoundCard } from "./templates/round-card";
import { SpotlightCard } from "./templates/spotlight-card";
import { StateCard } from "./templates/state-card";
import { HighlightCover } from "./templates/highlight-cover";
import { LaunchChart } from "./templates/launch-chart";
import { LaunchCompare } from "./templates/launch-compare";
import { LaunchCover } from "./templates/launch-cover";
import { LaunchLink } from "./templates/launch-link";
import { LaunchList } from "./templates/launch-list";
import { LaunchStory } from "./templates/launch-story";
import { LaunchText } from "./templates/launch-text";
import { ProfileAvatar } from "./templates/profile-avatar";
import { cardTokenCss, type Theme } from "./tokens";

export type { CardFormat, Theme };

/** A monthly set's card or a launch pack card. */
export type AnyCard = CardView | LaunchCard;

/** What `--html-only` writes: the same fields as a render job. */
export type HtmlJob<Card extends AnyCard = AnyCard> = {
  card: Card;
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
    square: SQUARE,
  };

function fontUrl(path: string): string {
  return pathToFileURL(join(ROOT, "node_modules", path)).href;
}

/** The two faces the cards use, named as the renderer's font checks name them. */
const FONT_FACES = [
  `@font-face{font-family:"Archivo";src:url("${fontUrl("@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2")}") format("woff2");font-weight:100 900;font-stretch:62% 125%;font-style:normal;}`,
  `@font-face{font-family:"Big Shoulders Stencil Display";src:url("${fontUrl("@fontsource/big-shoulders-stencil-display/files/big-shoulders-stencil-display-latin-900-normal.woff2")}") format("woff2");font-weight:900;font-style:normal;}`,
].join("\n");

const CARD_CSS = [
  readFileSync(join(__dirname, "card.css"), "utf8"),
  readFileSync(join(__dirname, "launch.css"), "utf8"),
].join("\n");

/** The launch pack's own templates (its closing card is the monthly sets'). */
type LaunchOnly = Exclude<LaunchCard, { id: "closing" }>;

const LAUNCH_IDS = new Set<string>([
  "launch-cover",
  "launch-list",
  "launch-text",
  "launch-chart",
  "launch-compare",
  "launch-link",
  "launch-story",
  "profile-avatar",
  "highlight",
] satisfies LaunchOnly["id"][]);

const isLaunchOnly = (card: AnyCard): card is LaunchOnly =>
  LAUNCH_IDS.has(card.id);

function launchTemplate(card: LaunchOnly, format: CardFormat): ReactElement {
  switch (card.id) {
    case "launch-cover":
      return createElement(LaunchCover, { card, format });
    case "launch-list":
      return createElement(LaunchList, { card, format });
    case "launch-text":
      return createElement(LaunchText, { card, format });
    case "launch-chart":
      return createElement(LaunchChart, { card, format });
    case "launch-compare":
      return createElement(LaunchCompare, { card, format });
    case "launch-link":
      return createElement(LaunchLink, { card, format });
    case "launch-story":
      return createElement(LaunchStory, { card, format });
    case "profile-avatar":
      return createElement(ProfileAvatar, { card });
    case "highlight":
      return createElement(HighlightCover, { card });
  }
}

function template(card: AnyCard, format: CardFormat): ReactElement {
  if (isLaunchOnly(card)) return launchTemplate(card, format);
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

/**
 * A full document for one card, format and theme. `guides` outlines a
 * story's sticker space (body.guides); the final PNGs never set it.
 */
export function cardHtml(
  card: AnyCard,
  format: CardFormat,
  theme: Theme,
  { guides = false }: { guides?: boolean } = {},
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
    `<body style="${size}"${guides ? ' class="guides"' : ""}>`,
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
