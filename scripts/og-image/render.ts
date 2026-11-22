import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  MARK_COLOURS,
  MARK_VIEWBOX,
  markSvgBody,
} from "../../src/components/brand/mark-geometry";

const root = resolve(__dirname, "..", "..");
const DEFAULT_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/** The reversed logo mark, generated from the same geometry as the site logo. */
export function markSvg(): string {
  return `<svg viewBox="${MARK_VIEWBOX}" aria-hidden="true">${markSvgBody(MARK_COLOURS.reversed)}</svg>`;
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
  const dir = mkdtempSync(join(tmpdir(), "og-"));
  const page = join(dir, "og.html");
  writeFileSync(page, html);

  const out = join(root, "public", "og.png");
  rmSync(out, { force: true });
  const chrome = process.env.CHROME_PATH ?? DEFAULT_CHROME;
  try {
    const result = spawnSync(
      chrome,
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
    if (result.error) {
      throw new Error(
        `Could not run Chrome at ${chrome}. Set CHROME_PATH to a Chrome binary. (${result.error.message})`,
      );
    }
    if (result.status !== 0) {
      throw new Error(`Chrome exited with status ${result.status}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  verifyPng(out);
  console.log(`Wrote ${out}`);
}

function verifyPng(file: string): void {
  if (!existsSync(file)) throw new Error(`Chrome did not write ${file}`);
  const png = readFileSync(file);
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    throw new Error(`${file} is not 1200x630`);
  }
}

if (require.main === module) main();
