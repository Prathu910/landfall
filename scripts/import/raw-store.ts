import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { MonthKey } from "../../src/lib/data/types";
import { writeFileAtomic, type WriteFile } from "./atomic-write";
import type { ViewId } from "./views";

export type RawTable = {
  header: string[];
  dictionaries: string[][];
  rows: (number | string)[][]; // dimension cells are dictionary indexes; the last column keeps the count text
};

export type RawViewFile = {
  viewId: ViewId;
  asAt: MonthKey;
  fetchedAt: string;
  source: string;
  selections: Record<string, string[]>;
  parts: { partition: Record<string, string>; table: RawTable }[];
};

export function encodeRaw(header: string[], rows: string[][]): RawTable {
  const dimensions = header.length - 1;
  const dictionaries: string[][] = Array.from({ length: dimensions }, () => []);
  const lookups = dictionaries.map(() => new Map<string, number>());
  const encoded = rows.map((row) =>
    row.map((cell, column) => {
      if (column >= dimensions) return cell;
      let index = lookups[column].get(cell);
      if (index === undefined) {
        index = dictionaries[column].length;
        dictionaries[column].push(cell);
        lookups[column].set(cell, index);
      }
      return index;
    }),
  );
  return { header, dictionaries, rows: encoded };
}

export function decodeRaw(table: RawTable): {
  header: string[];
  rows: string[][];
} {
  const dimensions = table.header.length - 1;
  return {
    header: table.header,
    rows: table.rows.map((row) =>
      row.map((cell, column) =>
        column < dimensions
          ? table.dictionaries[column][cell as number]
          : String(cell),
      ),
    ),
  };
}

function directory(root: string, asAt: MonthKey): string {
  return join(root, asAt);
}

function revisionNames(dir: string, viewId: ViewId): string[] {
  if (!existsSync(dir)) return [];
  const pattern = new RegExp(
    `^${viewId}\\.rev-(\\d{4}-\\d{2}-\\d{2})(?:-(\\d+))?\\.json$`,
  );
  return readdirSync(dir)
    .map((name) => ({ name, match: pattern.exec(name) }))
    .filter((entry) => entry.match)
    .sort((a, b) => {
      const dateOrder = a.match![1].localeCompare(b.match![1]);
      return dateOrder || Number(a.match![2] ?? 1) - Number(b.match![2] ?? 1);
    })
    .map((entry) => entry.name);
}

function load(path: string): RawViewFile {
  return JSON.parse(readFileSync(path, "utf8")) as RawViewFile;
}

function sameContent(a: RawViewFile, b: RawViewFile): boolean {
  return (
    JSON.stringify({ ...a, fetchedAt: "" }) ===
    JSON.stringify({ ...b, fetchedAt: "" })
  );
}

export function readRawView(
  root: string,
  asAt: MonthKey,
  viewId: ViewId,
): RawViewFile | undefined {
  const dir = directory(root, asAt);
  const newest = revisionNames(dir, viewId).at(-1);
  const name = newest ?? `${viewId}.json`;
  const path = join(dir, name);
  return existsSync(path) ? load(path) : undefined;
}

export function writeRawView(
  root: string,
  file: RawViewFile,
  options: { writeFile?: WriteFile } = {},
): { path: string; revised: boolean } {
  const dir = directory(root, file.asAt);
  mkdirSync(dir, { recursive: true });
  const base = join(dir, `${file.viewId}.json`);
  const current = readRawView(root, file.asAt, file.viewId);
  if (!current) {
    writeFileAtomic(base, JSON.stringify(file), options.writeFile);
    return { path: base, revised: false };
  }
  if (sameContent(current, file)) {
    const newest = revisionNames(dir, file.viewId).at(-1);
    return { path: newest ? join(dir, newest) : base, revised: false };
  }
  const date = file.fetchedAt.slice(0, 10);
  let path = join(dir, `${file.viewId}.rev-${date}.json`);
  for (let n = 2; existsSync(path); n++) {
    path = join(dir, `${file.viewId}.rev-${date}-${n}.json`);
  }
  writeFileAtomic(path, JSON.stringify(file), options.writeFile);
  return { path, revised: true };
}
