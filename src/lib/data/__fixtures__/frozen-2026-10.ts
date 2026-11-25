import { readFileSync } from "node:fs";
import path from "node:path";
import { generateFrozenSnapshot } from "../../../../scripts/import/frozen-snapshot";
import { readRoundsFile } from "../../../../scripts/import/generate-rounds";
import type {
  Manifest,
  OccupationCore,
  OccupationDetail,
  OccupationIndexEntry,
} from "../types";

/** Test-only: the frozen 2026-10 snapshot, generated once per worker. */
type Frozen = {
  manifest: Manifest;
  index: OccupationIndexEntry[];
  cores: Map<string, OccupationCore>;
  details: Map<string, OccupationDetail>;
};

let cached: Frozen | undefined;

function frozen(): Frozen {
  if (cached) return cached;
  const root = process.cwd();
  const stored = readRoundsFile(
    JSON.parse(
      readFileSync(path.resolve(root, "src/data/rounds.json"), "utf8"),
    ),
  );
  const data = generateFrozenSnapshot(path.resolve(root, "data/raw"), stored);
  cached = {
    manifest: data.manifest,
    index: data.index,
    cores: new Map(data.cores.map((core) => [core.code, core])),
    details: new Map(data.details.map((detail) => [detail.code, detail])),
  };
  return cached;
}

export const frozenCore = (code: string): OccupationCore | null =>
  frozen().cores.get(code) ?? null;
export const frozenDetail = (code: string): OccupationDetail | null =>
  frozen().details.get(code) ?? null;
export const frozenCores = (): OccupationCore[] => [...frozen().cores.values()];
export const frozenIndex = (): OccupationIndexEntry[] => frozen().index;
export const frozenManifest = (): Manifest => frozen().manifest;
