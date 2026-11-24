import { execFile } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs, promisify } from "node:util";
import * as chromeLauncher from "chrome-launcher";
import { AUDIT_PAGES } from "./pages";
import { startStaticServer } from "./serve";
import {
  CATEGORIES,
  formatTable,
  summariseCell,
  type Category,
  type Cell,
  type FormFactor,
  type RunResult,
  type Scheme,
} from "./summary";

/**
 * Runs Lighthouse over every SEO page type, mobile and desktop, three runs
 * each, and fails unless every gated median is 100 (docs/ENGINEERING.md,
 * "Performance budget"). It builds nothing: run `npm run build` first.
 *
 *   npm run lighthouse                         # the full matrix against out/
 *   npm run lighthouse -- --only guide --runs 1
 *   npm run lighthouse -- --base-url https://migratelens.com
 *   npm run lighthouse -- --only / --form mobile --cpu-slowdown 8   # PSI-like CPU
 *
 * Other flags: --runs N, --no-dark, --port 3020, --json <file> (medians),
 * --save-dir <dir> (every Lighthouse report as JSON).
 */
const DEFAULT_CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = resolve(__dirname, "..", "..");

const { values: args } = parseArgs({
  options: {
    runs: { type: "string", default: "3" },
    only: { type: "string" },
    form: { type: "string" },
    "base-url": { type: "string" },
    port: { type: "string", default: "3020" },
    "no-dark": { type: "boolean", default: false },
    json: { type: "string" },
    "save-dir": { type: "string" },
    "cpu-slowdown": { type: "string" },
  },
});

const run = promisify(execFile);
// The Lighthouse CLI, not its Node API: tsx would rewrite Lighthouse's
// in-page functions (adding esbuild's __name helper) and break them.
const LIGHTHOUSE_BIN = resolve(
  root,
  "node_modules",
  "lighthouse",
  "cli",
  "index.js",
);

function toRunResult(lhr: {
  categories: Record<string, { score: number | null } | undefined>;
  audits: Record<string, { numericValue?: number } | undefined>;
  environment?: { benchmarkIndex?: number };
}): RunResult {
  const scores: Partial<Record<Category, number>> = {};
  for (const category of CATEGORIES) {
    const score = lhr.categories[category]?.score;
    if (typeof score === "number") scores[category] = Math.round(score * 100);
  }
  return {
    scores,
    lcpMs: lhr.audits["largest-contentful-paint"]?.numericValue,
    tbtMs: lhr.audits["total-blocking-time"]?.numericValue,
    cls: lhr.audits["cumulative-layout-shift"]?.numericValue,
    benchmarkIndex: lhr.environment?.benchmarkIndex,
  };
}

interface RunTarget {
  url: string;
  port: number;
  formFactor: FormFactor;
  scheme: Scheme;
  categories: readonly Category[];
  label: string;
}

async function runOnce(target: RunTarget): Promise<RunResult> {
  const cliArgs = [
    LIGHTHOUSE_BIN,
    target.url,
    `--port=${target.port}`,
    "--output=json",
    "--output-path=stdout",
    "--quiet",
    `--only-categories=${target.categories.join(",")}`,
  ];
  if (target.formFactor === "desktop") cliArgs.push("--preset=desktop");
  // PageSpeed Insights runs on slower machines than a developer laptop; a
  // higher multiplier approximates its CPU (the default is 4 on mobile).
  const cpu = args["cpu-slowdown"];
  if (cpu) cliArgs.push(`--throttling.cpuSlowdownMultiplier=${cpu}`);
  const stdout = await lighthouseJson(cliArgs);
  const lhr = JSON.parse(stdout);
  if (lhr.runtimeError) {
    throw new Error(
      `${target.url}: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`,
    );
  }
  const saveDir = args["save-dir"];
  if (saveDir) {
    mkdirSync(saveDir, { recursive: true });
    writeFileSync(join(saveDir, `${target.label}.json`), stdout);
  }
  return toRunResult(lhr);
}

/** Chrome now and then drops a Lighthouse session; one retry recovers it. */
const ATTEMPTS = 2;

async function lighthouseJson(cliArgs: string[]): Promise<string> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const { stdout } = await run(process.execPath, cliArgs, {
        maxBuffer: 256 * 1024 * 1024,
      });
      return stdout;
    } catch (error) {
      if (attempt >= ATTEMPTS) throw error;
      console.warn(`Retrying ${cliArgs[1]} after a Lighthouse error`);
    }
  }
}

function slug(path: string): string {
  return path.replace(/^\/|\/$/g, "").replace(/\//g, "_") || "home";
}

/** prefers-color-scheme: dark for every page this Chrome opens. */
const DARK_FLAGS = ["--blink-settings=preferredColorScheme=0"];

async function withChrome<T>(
  scheme: Scheme,
  task: (port: number) => Promise<T>,
): Promise<T> {
  const chrome = await chromeLauncher.launch({
    chromePath: process.env.CHROME_PATH ?? DEFAULT_CHROME,
    chromeFlags: ["--headless=new", ...(scheme === "dark" ? DARK_FLAGS : [])],
  });
  try {
    return await task(chrome.port);
  } finally {
    chrome.kill();
  }
}

function plannedForms(): FormFactor[] {
  if (args.form === "mobile" || args.form === "desktop") return [args.form];
  if (args.form) throw new Error(`--form must be mobile or desktop`);
  return ["mobile", "desktop"];
}

async function main(): Promise<void> {
  const runs = Number(args.runs);
  // "--only /guide/" is one exact path; "--only guide" matches every guide page.
  const only = args.only;
  const pages = AUDIT_PAGES.filter(
    (page) =>
      !only ||
      (only.startsWith("/") ? page.path === only : page.path.includes(only)),
  );
  const forms = plannedForms();
  let baseUrl = args["base-url"];
  let close: (() => void) | undefined;
  if (!baseUrl) {
    const dir = resolve(root, "out");
    if (!existsSync(resolve(dir, "index.html"))) {
      throw new Error("out/ has no build. Run `npm run build` first.");
    }
    const port = Number(args.port);
    const server = await startStaticServer({ dir, host: "127.0.0.1", port });
    baseUrl = `http://127.0.0.1:${port}`;
    close = () => server.close();
  }
  const cells: Cell[] = [];
  try {
    await withChrome("light", async (port) => {
      for (const page of pages) {
        for (const formFactor of forms) {
          const cell: Cell = {
            page: page.path,
            formFactor,
            scheme: "light",
            gated: page.gated,
            runs: [],
          };
          for (let run = 0; run < runs; run += 1) {
            cell.runs.push(
              await runOnce({
                url: `${baseUrl}${page.path}`,
                port,
                formFactor,
                scheme: "light",
                categories: CATEGORIES,
                label: `${slug(page.path)}-${formFactor}-light-${run + 1}`,
              }),
            );
          }
          console.log(formatTable([summariseCell(cell)]).split("\n")[1]);
          cells.push(cell);
        }
      }
    });
    if (!args["no-dark"]) {
      // Contrast is the only score a colour scheme changes, and it doesn't
      // vary between runs, so dark gets one accessibility run per cell.
      await withChrome("dark", async (port) => {
        for (const page of pages) {
          for (const formFactor of forms) {
            const result = await runOnce({
              url: `${baseUrl}${page.path}`,
              port,
              formFactor,
              scheme: "dark",
              categories: ["accessibility"],
              label: `${slug(page.path)}-${formFactor}-dark`,
            });
            const cell: Cell = {
              page: page.path,
              formFactor,
              scheme: "dark",
              gated: ["accessibility"],
              runs: [result],
            };
            console.log(formatTable([summariseCell(cell)]).split("\n")[1]);
            cells.push(cell);
          }
        }
      });
    }
  } finally {
    close?.();
  }
  const summaries = cells.map(summariseCell);
  console.log(`\nMedian of ${runs} run(s), ${baseUrl}\n`);
  console.log(
    "CPU is Lighthouse's benchmark index: if a row's is far below the others, the machine was busy; re-run that page before trusting its Performance score.\n",
  );
  console.log(formatTable(summaries));
  if (args.json) writeFileSync(args.json, JSON.stringify(summaries, null, 2));
  const failing = summaries.filter((summary) => summary.failures.length > 0);
  if (failing.length > 0) {
    console.error(
      `\n${failing.length} row(s) below 100 (marked "!"). Open a report with: npx lighthouse <url> --view`,
    );
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
