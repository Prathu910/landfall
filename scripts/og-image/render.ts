import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  MARK_BARS,
  MARK_COLOURS,
  MARK_RING,
} from "../../src/components/brand/mark-geometry";

const root = resolve(__dirname, "..", "..");
const DEFAULT_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** The reversed logo mark, generated from the same geometry as the site logo. */
export function markSvg(): string {
  const { cx, cy, r, strokeWidth } = MARK_RING;
  const base = MARK_COLOURS.reversed;
  const bars = MARK_BARS.map(
    (b) =>
      `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="1" fill="${b.accent ? MARK_COLOURS.accent : base}"/>`,
  ).join("");
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${base}" stroke-width="${strokeWidth}"/>${bars}</svg>`;
}

function fontUrl(file: string): string {
  return pathToFileURL(join(root, "node_modules", "@fontsource", file)).href;
}

function main(): void {
  const html = readFileSync(join(__dirname, "template.html"), "utf8")
    .replace(
      "{{NEWSREADER_600}}",
      fontUrl("newsreader/files/newsreader-latin-600-normal.woff2"),
    )
    .replace(
      "{{INTER_500}}",
      fontUrl("inter/files/inter-latin-500-normal.woff2"),
    )
    .replace("{{MARK}}", markSvg());
  const page = join(mkdtempSync(join(tmpdir(), "og-")), "og.html");
  writeFileSync(page, html);

  const out = join(root, "public", "og.png");
  const result = spawnSync(
    process.env.CHROME_PATH ?? DEFAULT_CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--window-size=1200,630",
      "--virtual-time-budget=3000",
      `--screenshot=${out}`,
      pathToFileURL(page).href,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Chrome exited with ${result.status ?? result.error}`);
  }
  console.log(`Wrote ${out}`);
}

if (require.main === module) main();
