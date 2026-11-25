import type { Manifest, OccupationIndexEntry } from "../data/types";

// In the server bundle, every import of src/data/manifest.json and
// src/data/occupation-index.json resolves to these holders instead
// (scripts/report-engine/bundle.ts), so a deployed function reads the month
// it is handed rather than the month it was bundled with. They stay empty
// until setLiveData fills them; the site and tests import the real files.
export const liveManifest = {} as Manifest;
export const liveIndex: OccupationIndexEntry[] = [];

/**
 * Fills the holders in place: modules keep the object and array they
 * imported. The engine calls it right before each synchronous build, so two
 * requests never interleave between the fill and the build.
 */
export function setLiveData(
  manifest: Manifest,
  index: OccupationIndexEntry[],
): void {
  const holder = liveManifest as Record<string, unknown>;
  for (const key of Object.keys(holder)) delete holder[key];
  Object.assign(holder, manifest);
  liveIndex.splice(0, liveIndex.length, ...index);
}
