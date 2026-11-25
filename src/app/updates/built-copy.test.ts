import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BANNED_COPY } from "../../lib/report/copy";

/**
 * The banned-copy sweep over the built recap pages, so that copy written in
 * components (not only the view-models) is checked too. Needs `npm run
 * build`; skipped when `out/updates/` isn't there.
 */
const UPDATES = path.join(process.cwd(), "out", "updates");

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return pages(full);
    return entry.name === "index.html" ? [full] : [];
  });
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  nbsp: " ",
};

/** The page's readable text: its title, description and main content. */
function readableText(html: string): string {
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
  const description =
    /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "";
  const main = /<main\b[\s\S]*<\/main>/.exec(html)?.[0] ?? "";
  return [title, description, main]
    .join(" ")
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|\w+);/g, (match, name: string) =>
      name.startsWith("#")
        ? String.fromCharCode(Number(name.slice(1)))
        : (ENTITIES[name] ?? match),
    )
    .replace(/\s+/g, " ");
}

describe.skipIf(!existsSync(UPDATES))("the built recap pages", () => {
  const files = existsSync(UPDATES) ? pages(UPDATES) : [];

  it("include the index and at least one recap", () => {
    const rel = files.map((f) => path.relative(UPDATES, f));
    expect(rel).toContain("index.html");
    expect(rel.some((f) => /^\d{4}-\d{2}\/index\.html$/.test(f))).toBe(true);
  });

  it.each(files.map((f) => [path.relative(UPDATES, f), f]))(
    "%s passes the banned-copy sweep",
    (_name, file) => {
      const text = readableText(readFileSync(file, "utf8"));
      expect(text.length).toBeGreaterThan(200);
      expect(BANNED_COPY.exec(text)?.[0] ?? null).toBeNull();
    },
  );
});
