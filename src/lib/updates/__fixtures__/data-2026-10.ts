import { readFileSync } from "node:fs";
import path from "node:path";
import {
  frozenCore,
  frozenIndex,
  frozenManifest,
} from "../../data/__fixtures__/frozen-2026-10";
import type { RoundsFile } from "../../data/rounds-file";
import type { Manifest, OccupationCore } from "../../data/types";
import type { FederalList } from "../../state-outlook/rules-types";

/** Test-only inputs for the 2026-10 data section, from frozen records. */
export const MONTH = "2026-10";

const read = (file: string): unknown =>
  JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8"));

export const cores: OccupationCore[] = frozenIndex()
  .map((entry) => frozenCore(entry.code))
  .filter((core): core is OccupationCore => core !== null);

export const manifest = (): Manifest => frozenManifest();

/** The stored rounds up to the end of 2026-10 (stored rounds never change, R1). */
const stored = read("src/data/rounds.json") as RoundsFile;
export const rounds: RoundsFile = {
  ...stored,
  rounds: stored.rounds.filter((round) => round.date <= "2026-10-31"),
};

export const federal = read(
  "src/data/state-rules/federal-occupations.json",
) as FederalList;
