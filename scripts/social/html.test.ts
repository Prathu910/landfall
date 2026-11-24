import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  monthSetCards,
  roundSetCards,
  type CardView,
} from "../../src/lib/updates/cards";
import { loadRecap } from "../../src/lib/updates/load-server";
import { cardHtml, writeCardHtml } from "./html";

const oct = loadRecap("2026-10");
const month = monthSetCards(oct);
const byId = <Id extends CardView["id"]>(id: Id) =>
  month.find((c) => c.id === id) as Extract<CardView, { id: Id }>;
const card = byId("cover");

describe("cardHtml", () => {
  it("loads both faces by file URL", () => {
    const html = cardHtml(card, "feed", "light");
    expect(html).toMatch(/file:\/\/.*archivo-latin-wdth-normal\.woff2/);
    expect(html).toMatch(
      /file:\/\/.*big-shoulders-stencil-display-latin-900-normal\.woff2/,
    );
    expect(html).toContain('font-family:"Big Shoulders Stencil Display"');
  });

  it("escapes occupation names", () => {
    const spotlight = { ...byId("spotlight"), name: "Fish & Chips Cook" };
    const html = cardHtml(spotlight, "feed", "light");
    expect(html).toContain("Fish &amp; Chips Cook");
    expect(html).not.toContain("Fish & Chips");
  });

  it("marks story content as safe-zone content", () => {
    expect(cardHtml(card, "story", "dark")).toMatch(
      /<div class="content" data-safe="">/,
    );
    expect(cardHtml(card, "feed", "dark")).not.toContain("data-safe");
  });

  it("marks the cover's text and stamps as essential", () => {
    const html = cardHtml(card, "feed", "light");
    expect(html).toContain('<div class="cover-head" data-essential="">');
    expect(html).toMatch(/<div class="stamps [^"]*" data-essential="">/);
  });

  it("sizes the frame for each format", () => {
    expect(cardHtml(card, "feed", "light")).toContain(
      '<div class="frame feed" style="width:1080px;height:1350px">',
    );
    expect(cardHtml(card, "story", "light")).toContain(
      "width:1080px;height:1920px",
    );
    expect(cardHtml(card, "og", "light")).toContain(
      "width:1200px;height:630px",
    );
  });

  it("renders the theme it is asked for", () => {
    expect(cardHtml(card, "feed", "dark")).toContain(
      '<html lang="en-AU" data-theme="dark">',
    );
    expect(cardHtml(card, "feed", "dark")).toContain("color-scheme:dark;");
  });

  it("draws the swipe arrow, never the → glyph", () => {
    const html = cardHtml(card, "feed", "light");
    expect(html).toContain('class="swipe-arrow"');
    expect(html).not.toContain("→");
  });

  it("numbers every card but card 2", () => {
    expect(cardHtml(card, "feed", "light")).toContain(
      '<span class="tag">Oct 2026 · 1/6</span>',
    );
    expect(cardHtml(byId("round"), "feed", "light")).toContain(
      '<span class="tag">Oct 2026</span>',
    );
  });

  it("draws the cover without a round stamp in a month without a round", () => {
    const [cover] = monthSetCards({ ...oct, rounds: {} });
    const html = cardHtml(cover, "feed", "light");
    expect(html).toContain('class="stamps no-round"');
    expect(html).not.toContain("INVITED");
  });

  it("gives the round set's cover its one round stamp", () => {
    const [roundCover] = roundSetCards(oct, "2026-10-15");
    const html = cardHtml(roundCover, "feed", "light");
    expect(html).toContain('class="stamps single"');
    expect(html).toContain("15 October");
  });

  it("reads an all-masked state as under 20 on the map, never 0", () => {
    const html = cardHtml(byId("state-491"), "feed", "light");
    expect(html).toContain("&lt;20</text>");
    expect(html).toContain("each occupation</text>");
  });

  it("puts the handle and the disclaimer on the closing card", () => {
    const html = cardHtml(byId("closing"), "feed", "light");
    expect(html).toContain("@migratelens");
    expect(html).toContain("migratelens.com");
    expect(html).toContain("General information, not migration advice.");
  });
});

describe("writeCardHtml", () => {
  let dir = "";
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("writes one document per job, named after its PNG", () => {
    dir = mkdtempSync(join(tmpdir(), "cards-"));
    const files = writeCardHtml(
      [
        { card, format: "feed", theme: "dark", out: "x/month/cover-dark.png" },
        { card, format: "og", theme: "light", out: "x/og.png" },
      ],
      dir,
    );
    expect(files).toEqual([join(dir, "cover-dark.html"), join(dir, "og.html")]);
    expect(readFileSync(files[1], "utf8")).toContain("frame og");
  });
});
