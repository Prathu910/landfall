/**
 * SERVER ONLY. Uses node `fs`; import only from Server Components and
 * `generateStaticParams`, never from a "use client" module.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { isManifest, isOccupationCore, isOccupationDetail } from "./guards";
import type { Manifest, OccupationCore, OccupationDetail } from "./types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const CODE_PATTERN = /^[0-9]{6}$/;

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function loadManifest(): Manifest {
  const value = readJson(path.join(DATA_DIR, "manifest.json"));
  if (!isManifest(value)) throw new Error("src/data/manifest.json is invalid");
  return value;
}

function loadOccupationFile(code: string, suffix: string): unknown {
  if (!CODE_PATTERN.test(code)) return null;
  try {
    return readJson(
      path.join(DATA_DIR, "occupations", `${code}${suffix}.json`),
    );
  } catch {
    return null;
  }
}

export function loadOccupationCore(code: string): OccupationCore | null {
  const value = loadOccupationFile(code, "");
  return isOccupationCore(value) ? value : null;
}

export function loadOccupationDetail(code: string): OccupationDetail | null {
  const value = loadOccupationFile(code, ".detail");
  return isOccupationDetail(value) ? value : null;
}
