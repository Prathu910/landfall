import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { markSvgBody } from "../../src/components/brand/mark-geometry";
import {
  FEE_EXAMPLES,
  ONSHORE_CHARGE,
  VISA_FEE_ARTICLE,
} from "../../src/data/news/onshore-visa-fee-increase-2026";
import { SHELL_PALETTE } from "../../src/lib/brand/palette";

const root = resolve(__dirname, "..", "..");
const money = new Intl.NumberFormat("en-AU");
const font = readFileSync(
  join(
    root,
    "node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2",
  ),
).toString("base64");
const art = readFileSync(join(root, "public/report-passport-a.svg")).toString(
  "base64",
);
const colours = SHELL_PALETTE;
const rows = FEE_EXAMPLES.map(
  (fee) =>
    `<div class="row"><span>${fee.visa}</span><span class="before">$${money.format(fee.before)}</span><span>→</span><b>$${money.format(fee.after)}</b></div>`,
).join("");

const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><style>
@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;font-display:block}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:${colours.sage};color:${colours.ink};font-family:Archivo,sans-serif;padding:30px}
.page{height:570px;border:1px solid ${colours.line};border-radius:20px;background:${colours.paper} url(data:image/svg+xml;base64,${art}) center/cover;display:grid;grid-template-columns:1.25fr 1fr;padding:42px;gap:44px}
.brand{display:flex;align-items:center;gap:10px;font-size:30px;font-weight:700}.brand svg{width:40px;height:40px}
.tag{margin-top:46px;color:${colours.green};font-size:20px;font-weight:700;letter-spacing:2px}
h1{font-size:54px;line-height:1.04;letter-spacing:-1.5px;margin:18px 0 22px;font-weight:800}p{font-size:22px;line-height:1.4;margin:0;color:${colours.muted}}
.date{margin-top:26px;font-size:18px}.fees{padding-top:80px}.extra{font-size:66px;letter-spacing:-2px;font-weight:800}.label{font-size:19px;color:${colours.muted};margin:2px 0 26px}
.row{display:grid;grid-template-columns:72px 1fr 22px 1fr;gap:8px;align-items:center;padding:17px 0;border-top:1px solid ${colours.line};font-size:24px}.row>span:first-child{font-size:18px;font-weight:600}.before{color:${colours.muted}}.row b{color:${colours.green};text-align:right}
.note{font-size:15px;margin-top:18px;color:${colours.muted}}
</style></head><body><div class="page"><div><div class="brand"><svg viewBox="0 0 48 48">${markSvgBody()}</svg>MigrateLens</div><div class="tag">AUSTRALIA / VISA FEE UPDATE</div><h1>New onshore<br>visa charge</h1><p>Before-and-after fees.<br>Who pays. Who is exempt.</p><p class="date">Effective 28 November 2026</p></div><div class="fees"><div class="extra">+$${money.format(ONSHORE_CHARGE)}</div><div class="label">AUD per affected applicant</div>${rows}<p class="note">Standard main-applicant examples. Exemptions apply.</p></div></div></body></html>`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const output = join(root, "public", VISA_FEE_ARTICLE.image);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate("document.fonts.ready");
    mkdirSync(dirname(output), { recursive: true });
    await page.screenshot({ path: output, type: "png" });
  } finally {
    await browser.close();
  }
  const png = readFileSync(output);
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    throw new Error("The news share image must be 1200×630.");
  }
  console.log(`Wrote ${output}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
