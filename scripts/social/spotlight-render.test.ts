import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { monthSetCards, type SpotlightCard } from "../../src/lib/updates/cards";
import { loadRecap } from "../../src/lib/updates/load-server";
import { popularOccupations } from "../../src/lib/updates/spotlight";
import { frozenCores } from "../../src/lib/data/__fixtures__/frozen-2026-10";
import { cardHtml } from "./html";
import { DEFAULT_CHROME } from "./render";

const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;

const oct = loadRecap("2026-10");
const spotlight = monthSetCards(oct).find(
  (card): card is SpotlightCard => card.id === "spotlight",
) as SpotlightCard;
const popular = popularOccupations(frozenCores(), "2026-10").map(
  (core) => core.name,
);
/** One word wider than the title column at every size. */
const UNBREAKABLE = "Supercalifragilisticexpialidocious Specialist";

/**
 * What the renderer will refuse: `.fit` or `.inner` overflowing. Also where
 * the stamp sits, so a title widening its column shows. A string, because
 * tsx would add helpers the page doesn't have to a function.
 */
const MEASURE = `(() => {
  const overflow = [...document.querySelectorAll(".fit, .inner")]
    .filter((el) => el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)
    .map((el) => el.className);
  const stamp = document.querySelector(".spot-head > svg").getBoundingClientRect();
  return { overflow, stampLeft: Math.round(stamp.left) };
})()`;

type Measure = { overflow: string[]; stampLeft: number };

describe.skipIf(!existsSync(chrome))("the spotlight card in Chrome", () => {
  let browser: Browser;
  let page: Page;
  let dir: string;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: true,
      args: ["--hide-scrollbars", "--force-color-profile=srgb"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
    dir = mkdtempSync(join(tmpdir(), "spotlight-"));
  });
  afterAll(async () => {
    await browser?.close();
    rmSync(dir, { recursive: true, force: true });
  });

  async function render(name: string): Promise<Measure> {
    const file = join(dir, "spotlight.html");
    writeFileSync(file, cardHtml({ ...spotlight, name }, "feed", "light"));
    await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
    await page.evaluate("document.fonts.ready");
    return (await page.evaluate(MEASURE)) as Measure;
  }

  it("fits each of the 20 most popular names with the stamp in place", async () => {
    const baseline = await render(spotlight.name);
    expect(baseline.overflow).toEqual([]);
    expect(popular).toContain("Computer Network and Systems Engineer");
    for (const name of popular) {
      const measured = await render(name);
      expect(measured.overflow, name).toEqual([]);
      expect(measured.stampLeft, name).toBe(baseline.stampLeft);
    }
  }, 60_000);

  it("overflows, rather than pushing the stamp, on an unbreakable word", async () => {
    const baseline = await render(spotlight.name);
    const measured = await render(UNBREAKABLE);
    expect(measured.overflow).toContain("title fit");
    expect(measured.stampLeft).toBe(baseline.stampLeft);
  }, 30_000);
});
