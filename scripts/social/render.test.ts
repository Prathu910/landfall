import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { monthSetCards, type CardView } from "../../src/lib/updates/cards";
import { loadRecap } from "../../src/lib/updates/load-server";
import { SHELL_PALETTE } from "../../src/lib/brand/palette";
import { cardHtml } from "./html";
import type { RenderJob } from "./jobs";
import { DEFAULT_CHROME, openRenderer, type CardRenderer } from "./render";

const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;

const oct = loadRecap("2026-10");
const month = monthSetCards(oct);
const byId = <Id extends CardView["id"]>(id: Id) =>
  month.find((c) => c.id === id) as Extract<CardView, { id: Id }>;
/** One word wider than the spotlight's title column at every size. */
const UNBREAKABLE = "Supercalifragilisticexpialidocious Specialist";

const job = (
  card: CardView,
  format: RenderJob["format"],
  theme: RenderJob["theme"],
): RenderJob => ({
  card,
  format,
  theme,
  out: `test/${card.id}-${format}-${theme}.png`,
});

/** The card's own document with one more style rule at the end. */
const withStyle = (j: RenderJob, css: string) =>
  cardHtml(j.card, j.format, j.theme).replace("</style>", `${css}</style>`);

const pngSize = (png: Buffer) => ({
  signature: png.subarray(1, 4).toString(),
  width: png.readUInt32BE(16),
  height: png.readUInt32BE(20),
});

const SLOW = 60_000;

describe.skipIf(!existsSync(chrome))("rendering cards in Chrome", () => {
  let renderer: CardRenderer;

  beforeAll(async () => {
    renderer = await openRenderer(chrome);
  }, SLOW);
  afterAll(async () => {
    await renderer?.close();
  });

  it(
    "renders a dark feed card to a 1080x1350 PNG",
    async () => {
      const png = await renderer.render(job(byId("state-190"), "feed", "dark"));
      expect(pngSize(png)).toEqual({
        signature: "PNG",
        width: 1080,
        height: 1350,
      });
    },
    SLOW,
  );

  it(
    "renders a story at 1080x1920 and the OG image at 1200x630",
    async () => {
      const cover = byId("cover");
      const story = await renderer.render(job(cover, "story", "light"));
      expect(pngSize(story)).toMatchObject({ width: 1080, height: 1920 });
      const og = await renderer.render(job(cover, "og", "light"));
      expect(pngSize(og)).toMatchObject({ width: 1200, height: 630 });
    },
    SLOW,
  );

  it(
    "refuses a long name that overflows, naming the output",
    async () => {
      const card = { ...byId("spotlight"), name: UNBREAKABLE };
      await expect(renderer.render(job(card, "feed", "light"))).rejects.toThrow(
        /^test\/spotlight-feed-light\.png: text overflows \.title\.fit/,
      );
    },
    SLOW,
  );

  it(
    "refuses a dark render that came out light",
    async () => {
      const dark = job(byId("closing"), "feed", "dark");
      const light = cardHtml(dark.card, "feed", "light");
      await expect(renderer.render(dark, light)).rejects.toThrow(
        `--paper is ${SHELL_PALETTE.paper}, not `,
      );
    },
    SLOW,
  );

  it(
    "refuses a card whose face did not load",
    async () => {
      const j = job(byId("closing"), "feed", "light");
      const html = cardHtml(j.card, j.format, j.theme).replace(
        "big-shoulders-stencil-display-latin-900-normal.woff2",
        "missing.woff2",
      );
      await expect(renderer.render(j, html)).rejects.toThrow(
        'font 900 40px "Big Shoulders Stencil Display" did not load',
      );
    },
    SLOW,
  );

  it(
    "refuses story content outside the safe zone",
    async () => {
      const j = job(byId("cover"), "story", "light");
      const html = withStyle(j, ".story [data-safe]{margin-top:-200px}");
      await expect(renderer.render(j, html)).rejects.toThrow(
        /story content spans y \d+-\d+, outside the safe zone 250-1580/,
      );
    },
    SLOW,
  );

  it(
    "refuses feed cover text outside the grid crop",
    async () => {
      const j = job(byId("cover"), "feed", "light");
      const html = withStyle(
        j,
        ".feed [data-essential]{transform:translateX(-200px)}",
      );
      await expect(renderer.render(j, html)).rejects.toThrow(
        /cover text spans x -?\d+-\d+, outside the grid crop 34-1046/,
      );
    },
    SLOW,
  );
});
