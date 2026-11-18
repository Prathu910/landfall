import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { GeneratedData } from "./generate";

export type WriteOptions = { serialize?: (value: unknown) => string };

type Swap = { staged: string; live: string; backup: string };

function stage(
  staging: string,
  data: GeneratedData,
  serialize: (value: unknown) => string,
): void {
  const occupations = join(staging, "occupations");
  mkdirSync(occupations);
  for (const core of data.cores) {
    writeFileSync(join(occupations, `${core.code}.json`), serialize(core));
  }
  for (const detail of data.details) {
    writeFileSync(
      join(occupations, `${detail.code}.detail.json`),
      serialize(detail),
    );
  }
  writeFileSync(join(staging, "manifest.json"), serialize(data.manifest));
  writeFileSync(join(staging, "occupation-index.json"), serialize(data.index));
  writeFileSync(join(staging, "rounds.json"), serialize(data.rounds));
  writeFileSync(
    join(staging, "rounds-meta.json"),
    serialize({ skipped: data.rounds.skipped }),
  );
}

/** Moves each staged entry into place; on any failure restores what was there. */
function swapIn(swaps: Swap[]): void {
  const done: (Swap & { hadLive: boolean; installed: boolean })[] = [];
  try {
    for (const swap of swaps) {
      const entry = {
        ...swap,
        hadLive: existsSync(swap.live),
        installed: false,
      };
      if (entry.hadLive) renameSync(swap.live, swap.backup);
      done.push(entry);
      renameSync(swap.staged, swap.live);
      entry.installed = true;
    }
  } catch (error) {
    for (const entry of done.reverse()) {
      if (entry.installed) renameSync(entry.live, entry.staged);
      if (entry.hadLive) renameSync(entry.backup, entry.live);
    }
    throw error;
  }
}

/**
 * Writes manifest.json, occupation-index.json, rounds.json, rounds-meta.json
 * (the skipped rounds, small enough for client code to import) and occupations/
 * under `outRoot`. Everything is first written to a staging folder inside
 * `outRoot` (same filesystem, so renames are atomic), then swapped in. A
 * failure while staging leaves `outRoot` untouched. Other files are kept.
 */
export function writeGenerated(
  outRoot: string,
  data: GeneratedData,
  options: WriteOptions = {},
): void {
  const serialize = options.serialize ?? ((value) => JSON.stringify(value));
  mkdirSync(outRoot, { recursive: true });
  const staging = mkdtempSync(join(outRoot, ".generate-"));
  try {
    stage(staging, data, serialize);
    swapIn(
      [
        "occupations",
        "manifest.json",
        "occupation-index.json",
        "rounds.json",
        "rounds-meta.json",
      ].map((name) => ({
        staged: join(staging, name),
        live: join(outRoot, name),
        backup: join(staging, `${name}.previous`),
      })),
    );
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
