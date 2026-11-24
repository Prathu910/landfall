import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..", "..");
const MANTINE = join(root, "node_modules", "@mantine");
const PACKAGES = ["core", "dates"] as const;
type Package = (typeof PACKAGES)[number];

/** Files every Mantine page needs, whatever it renders. */
const ALWAYS = ["baseline", "default-css-variables", "global"];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name)) return [];
    return [path];
  });
}

/** Names the site imports from a Mantine package (type-only names included; they resolve to nothing). */
function importedNames(pkg: Package): Set<string> {
  const pattern = new RegExp(
    `import\\s*(?:type\\s*)?\\{([^}]*)\\}\\s*from\\s*"@mantine/${pkg}"`,
    "g",
  );
  const names = new Set<string>();
  for (const file of sourceFiles(join(root, "src"))) {
    for (const match of readFileSync(file, "utf8").matchAll(pattern)) {
      for (const part of match[1].split(",")) {
        const name = part.replace(/^\s*type\s+/, "").trim();
        if (name) names.add(name);
      }
    }
  }
  return names;
}

/** Maps each export of a package's ESM index to the file that defines it. */
function exportFiles(pkg: Package): Map<string, string> {
  const esm = join(MANTINE, pkg, "esm");
  const index = readFileSync(join(esm, "index.mjs"), "utf8");
  const files = new Map<string, string>();
  for (const match of index.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*"(\.[^"]+)"/g,
  )) {
    for (const name of match[1].split(",")) {
      files.set(name.trim(), join(esm, match[2]));
    }
  }
  return files;
}

/**
 * The Mantine stylesheets a set of exports needs: every `X.module.mjs` their
 * code reaches through relative imports, plus what they import from
 * @mantine/core. Dates ships one stylesheet for the whole package.
 */
function requiredStylesheets(): Set<string> {
  const exports = { core: exportFiles("core"), dates: exportFiles("dates") };
  const needed = new Set<string>(ALWAYS);
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    if (file.endsWith(".module.mjs")) {
      if (file.includes(`${join("@mantine", "dates")}`)) needed.add("dates");
      else needed.add(basename(file, ".module.mjs"));
    }
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/from\s*"(\.[^"]+)"/g)) {
      visit(join(dirname(file), match[1]));
    }
    for (const match of text.matchAll(
      /import\s*\{([^}]*)\}\s*from\s*"@mantine\/core"/g,
    )) {
      for (const name of match[1].split(",")) {
        const target = exports.core.get(name.trim());
        if (target) visit(target);
      }
    }
  };
  for (const pkg of PACKAGES) {
    for (const name of importedNames(pkg)) {
      const target = exports[pkg].get(name);
      if (target) visit(target);
    }
  }
  return needed;
}

function listedStylesheets(): string[] {
  const text = readFileSync(join(__dirname, "mantine-styles.ts"), "utf8");
  return [...text.matchAll(/import\s+"@mantine\/([^"]+)";/g)].map((match) =>
    match[1] === "dates/styles.css"
      ? "dates"
      : basename(match[1].replace(/^core\/styles\//, ""), ".css"),
  );
}

/** Where a stylesheet's first rule sits inside Mantine's full styles.css. */
function bundlePosition(name: string): number {
  if (ALWAYS.includes(name)) return ALWAYS.indexOf(name) - ALWAYS.length;
  if (name === "dates") return Number.MAX_SAFE_INTEGER;
  const bundle = readFileSync(join(MANTINE, "core", "styles.css"), "utf8");
  const own = readFileSync(
    join(MANTINE, "core", "styles", `${name}.css`),
    "utf8",
  );
  const firstClass = own.match(/\.m_[0-9a-f]+/)?.[0];
  if (!firstClass) throw new Error(`${name}.css has no Mantine class`);
  return bundle.indexOf(firstClass);
}

describe("mantine-styles.ts", () => {
  const listed = listedStylesheets();

  it("lists exactly the stylesheets the imported Mantine components need", () => {
    expect([...listed].sort()).toEqual([...requiredStylesheets()].sort());
  });

  it("keeps the order the files have inside Mantine's styles.css", () => {
    const positions = listed.map(bundlePosition);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("is imported by the root layout before globals.css", () => {
    const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
    const styles = layout.indexOf('"@/components/mantine-styles"');
    expect(styles).toBeGreaterThan(-1);
    expect(styles).toBeLessThan(layout.indexOf('"./globals.css"'));
    expect(layout).not.toContain("@mantine/core/styles.css");
    expect(relative(root, __dirname)).toBe(join("src", "components"));
  });
});
