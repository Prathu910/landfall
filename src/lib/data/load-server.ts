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

/** What /sample/ needs to date its frozen snapshot. */
export type SampleMeta = {
  snapshotId: string;
  asAt: string;
  checkedAt: string;
  sources: Manifest["sources"];
};

const SAMPLE_DIR = path.join(DATA_DIR, "sample", "2026-10");

function readSampleFile(name: string): unknown {
  return readJson(path.join(SAMPLE_DIR, name));
}

/** The frozen 2026-10 core of a sample occupation; throws if it is missing. */
export function loadSampleCore(code: string): OccupationCore {
  const value = readSampleFile(`${code}.json`);
  if (!isOccupationCore(value))
    throw new Error(`Sample core ${code} is invalid`);
  return value;
}

export function loadSampleDetail(code: string): OccupationDetail {
  const value = readSampleFile(`${code}.detail.json`);
  if (!isOccupationDetail(value)) {
    throw new Error(`Sample detail ${code} is invalid`);
  }
  return value;
}

export function loadSampleMeta(): SampleMeta {
  const value = readSampleFile("meta.json") as Partial<SampleMeta> | null;
  const sources = value?.sources;
  if (
    !value ||
    typeof value.snapshotId !== "string" ||
    typeof value.asAt !== "string" ||
    typeof value.checkedAt !== "string" ||
    !sources ||
    typeof sources.dashboard !== "string" ||
    typeof sources.currentRounds !== "string" ||
    typeof sources.previousRounds !== "string"
  ) {
    throw new Error("Sample meta.json is invalid");
  }
  return value as SampleMeta;
}
