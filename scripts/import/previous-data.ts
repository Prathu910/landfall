import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isManifest,
  isOccupationCore,
  isOccupationDetail,
} from "../../src/lib/data/guards";
import type { PreviousData } from "./generate";

function readJson(path: string): unknown {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

/**
 * The data now in `outRoot`, for carrying dropped occupations forward, or
 * null when there is no manifest (the legacy files are not one). Records are
 * read when asked for and must pass their guards.
 */
export function readPreviousData(outRoot: string): PreviousData | null {
  const manifest = readJson(join(outRoot, "manifest.json"));
  if (!isManifest(manifest)) return null;
  const record = <T>(
    code: string,
    suffix: string,
    guard: (value: unknown) => value is T,
  ): T | null => {
    const value = readJson(
      join(outRoot, "occupations", `${code}${suffix}.json`),
    );
    return guard(value) ? value : null;
  };
  return {
    manifest,
    core: (code) => record(code, "", isOccupationCore),
    detail: (code) => record(code, ".detail", isOccupationDetail),
  };
}
