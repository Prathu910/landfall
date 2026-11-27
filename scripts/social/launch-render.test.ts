import { existsSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stateRuleData } from "../../src/components/data/state-rule-data";
import { PASS_MARK, POINTS_TABLE } from "../../src/data/guide/points-table";
import { frozenCore } from "../../src/lib/data/__fixtures__/frozen-2026-10";
import type { OccupationCore } from "../../src/lib/data/types";
import type { LaunchCard } from "../../src/lib/social/launch-types";
import { occupationCards } from "../../src/lib/social/occupation-post";
import { stateRows } from "../../src/lib/occupation-page/states";
import { pointsCards } from "../../src/lib/social/points-post";
import {
  avatarCard,
  highlightCards,
  launchStories,
} from "../../src/lib/social/stories";
import { cardHtml, type HtmlJob } from "./html";
import { DEFAULT_CHROME, openRenderer, type CardRenderer } from "./renderer";

const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;
const SLOW = 60_000;

const job = (card: LaunchCard, format: HtmlJob["format"]): HtmlJob => ({
  card,
  format,
  theme: "light",
  out: `test/${card.id}.png`,
});

const pngSize = (png: Buffer) => ({
  width: png.readUInt32BE(16),
  height: png.readUInt32BE(20),
});

describe.skipIf(!existsSync(chrome))("rendering launch cards in Chrome", () => {
  let renderer: CardRenderer;

  beforeAll(async () => {
    renderer = await openRenderer(chrome);
  }, SLOW);
  afterAll(async () => {
    await renderer?.close();
  });

  it(
    "renders every points table slide inside its page",
    async () => {
      for (const card of pointsCards(POINTS_TABLE, PASS_MARK)) {
        const png = await renderer.render(job(card, "feed"));
        expect(pngSize(png)).toEqual({ width: 1080, height: 1350 });
      }
    },
    SLOW,
  );

  it(
    "renders the occupation spotlight on the frozen snapshot",
    async () => {
      const core = frozenCore("254499") as OccupationCore;
      const cards = occupationCards({
        core,
        rows: stateRows(core.code, core, stateRuleData),
        tieBreak: "2025-11-19",
        federal: stateRuleData.federal,
      });
      for (const card of cards) await renderer.render(job(card, "feed"));
    },
    SLOW,
  );

  it(
    "renders the stories in the safe band and the profile kit in the crop circle",
    async () => {
      for (const { card } of launchStories()) {
        expect(pngSize(await renderer.render(job(card, "story")))).toEqual({
          width: 1080,
          height: 1920,
        });
      }
      const avatar = await renderer.render(job(avatarCard(), "square"));
      expect(pngSize(avatar)).toEqual({ width: 1080, height: 1080 });
      for (const card of highlightCards())
        await renderer.render(job(card, "story"));
    },
    SLOW,
  );

  it(
    "refuses a profile picture that reaches outside the crop circle",
    async () => {
      const j = job(avatarCard(), "square");
      const html = cardHtml(j.card, j.format, j.theme).replace(
        "</style>",
        ".avatar-mark{width:1000px;height:1000px}</style>",
      );
      await expect(renderer.render(j, html)).rejects.toThrow(
        /outside the 540px crop circle/,
      );
    },
    SLOW,
  );

  it("outlines a story's sticker space only in a --guides render", () => {
    const [{ card }] = launchStories();
    expect(cardHtml(card, "story", "light")).toMatch(/<body style="[^"]*">/);
    expect(cardHtml(card, "story", "light", { guides: true })).toContain(
      '<body style="width:1080px;height:1920px" class="guides">',
    );
  });
});
