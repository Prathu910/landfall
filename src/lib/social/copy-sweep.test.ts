import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../report/copy";
import { charsOutside, parseUnicodeRange } from "../updates/glyphs";
import { calendarMarkdown, replyExample } from "./calendar";
import { captionText, captionsMarkdown } from "./captions";
import { buildLaunchPack } from "./launch-pack";
import type { LaunchCard } from "./launch-types";
import { loadLaunchInput } from "./load-server";
import { PROFILE_OPTIONS, profileMarkdown } from "./profile";

/**
 * The launch pack built from the live data, as the renderer builds it: copy
 * invariants only, so a new month can't break them; figures are tested on
 * the frozen snapshot in launch-pack.test.ts.
 */
const input = loadLaunchInput({ state: "NSW", occupation: "254499" });
const pack = buildLaunchPack(input);

const ZERO_RANGE = /(?<![\d,.])0–/;
const REPEATED_RANGE = /\b(\d[\d,]*)(?: to |–)\1\b/;
const ZERO_FIGURE = /\b(at least|about) 0\b/;
const BROKEN = /\bNaN\b|\bundefined\b|\bnull\b|\[object/;
/** No price in the pack: prices come only from the checkout. */
const PRICE = /₹|\$|\bAUD\b|\bINR\b|\bprice/i;
const ISSUED = /invitations? (issued|sent) (in|that)/i;
const HIDDEN_KEYS = new Set(["id", "visas", "position", "solid", "hatched"]);

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, item]) =>
      HIDDEN_KEYS.has(key) ? [] : strings(item),
    );
  }
  return [];
}

const cards: LaunchCard[] = [
  ...pack.posts.flatMap((p) =>
    p.slides.flatMap((s) => (s.kind === "card" ? [s.card] : [])),
  ),
  ...pack.stories.map((s) => s.card),
];

const allText = [
  ...cards.flatMap(strings),
  ...pack.posts.flatMap((p) => [
    p.title,
    captionText(p.caption),
    ...p.slides.map((s) => s.alt),
  ]),
  ...pack.stories.map((s) => s.alt),
  captionsMarkdown(pack),
  calendarMarkdown(pack, "2026-11-28", replyExample(input.occupation)),
  profileMarkdown(),
];

function latin(...parts: string[]) {
  const css = readFileSync(
    path.join(process.cwd(), "node_modules", ...parts.slice(0, -1)),
    "utf8",
  );
  const file = parts[parts.length - 1];
  const block = css
    .split("@font-face")
    .find((b) => b.includes(`${file}.woff2`));
  if (!block) throw new Error(`No @font-face for ${file}`);
  return parseUnicodeRange(block);
}

describe("the launch pack's copy", () => {
  it("passes the copy and number rules everywhere", () => {
    const problems = allText.filter(
      (s) =>
        BANNED_COPY.test(s) ||
        BROKEN.test(s) ||
        PRICE.test(s) ||
        ZERO_RANGE.test(s) ||
        REPEATED_RANGE.test(s) ||
        ZERO_FIGURE.test(s),
    );
    expect(problems).toEqual([]);
  });

  it("never calls a state's month-end count invitations issued (R3)", () => {
    const state = pack.posts[7];
    const text = [
      ...state.slides.flatMap((s) =>
        s.kind === "card" ? strings(s.card) : [],
      ),
      captionText(state.caption),
    ];
    expect(text.filter((s) => ISSUED.test(s))).toEqual([]);
  });

  it("stays inside the bundled font subsets on every card", () => {
    const archivo = latin(
      "@fontsource-variable",
      "archivo",
      "wdth.css",
      "archivo-latin-wdth-normal",
    );
    const stencil = latin(
      "@fontsource",
      "big-shoulders-stencil-display",
      "900.css",
      "big-shoulders-stencil-display-latin-900-normal",
    );
    const text = cards.flatMap(strings).join("");
    expect(charsOutside(text, archivo)).toEqual([]);
    expect(charsOutside(text, stencil)).toEqual([]);
  });

  it("gives every post 5 to 8 hashtags, one call to action and dated alt text", () => {
    for (const post of pack.posts) {
      expect(post.caption.hashtags.length, post.slug).toBeGreaterThanOrEqual(5);
      expect(post.caption.hashtags.length, post.slug).toBeLessThanOrEqual(8);
      expect(new Set(post.caption.hashtags).size).toBe(
        post.caption.hashtags.length,
      );
      for (const tag of post.caption.hashtags)
        expect(tag).toMatch(/^#[A-Za-z0-9]+$/);
      const sentences = post.caption.body
        .join(" ")
        .split(/(?<=[.!?]) (?=[A-Z0-9“])/);
      expect(sentences.length, post.slug).toBeGreaterThanOrEqual(2);
      expect(sentences.length, post.slug).toBeLessThanOrEqual(4);
      for (const slide of post.slides)
        expect(slide.alt.length).toBeGreaterThan(20);
    }
  });

  it("keeps the profile's names and bios inside Instagram's limits", () => {
    for (const option of PROFILE_OPTIONS) {
      expect(option.name.length).toBeLessThanOrEqual(30);
      expect(option.bio.length).toBeLessThanOrEqual(150);
      expect(option.bio).toMatch(
        /General information, not migration advice\.$/,
      );
    }
  });
});
