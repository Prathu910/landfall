/**
 * PNG compression and the size limits for a rendered image set (spec 6.7),
 * and the shape of the set's `set.json` manifest.
 */
import sharp from "sharp";
import type { MonthKey } from "../../src/lib/data/types";
import type { CardId } from "../../src/lib/updates/cards";
import type { CardFormat, Theme } from "./html";

export const IMAGE_LIMIT_BYTES = 300 * 1024;
export const SET_LIMIT_BYTES = 2.5 * 1024 * 1024;

/** One image in `set.json`; `file` is relative to the repo root. */
export type SetImage = {
  card: CardId;
  format: CardFormat;
  theme: Theme;
  file: string;
  alt: string;
};

/** `set.json`: what the monthly job reads to build the PR and the post. */
export type SetManifest = {
  kind: "round" | "month";
  month: MonthKey;
  /** The round set's round date; null for a month set. */
  round: string | null;
  images: SetImage[];
  /** Files in other sets that this set shows but does not render. */
  reused: string[];
  caption: string;
};

/**
 * Re-encodes a PNG as a 256-colour palette image. Throws if the result's
 * size differs from the input's.
 */
export async function quantise(png: Buffer): Promise<Buffer> {
  const before = await sharp(png).metadata();
  const out = await sharp(png)
    .png({ palette: true, colours: 256, effort: 10 })
    .toBuffer();
  const after = await sharp(out).metadata();
  if (before.width !== after.width || before.height !== after.height) {
    throw new Error(
      `Quantising changed the size from ${before.width}x${before.height} to ${after.width}x${after.height}`,
    );
  }
  return out;
}

const kb = (bytes: number) => (bytes / 1024).toFixed(1);
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

/** One message for each image over the image limit, and one if the set is over its limit. */
export function checkLimits(
  files: { path: string; bytes: number }[],
): string[] {
  const problems = files
    .filter((file) => file.bytes > IMAGE_LIMIT_BYTES)
    .map(
      (file) =>
        `${file.path} is ${kb(file.bytes)} KB, over the ${IMAGE_LIMIT_BYTES / 1024} KB limit`,
    );
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  if (total > SET_LIMIT_BYTES) {
    problems.push(
      `set is ${mb(total)} MB, over the ${mb(SET_LIMIT_BYTES)} MB limit`,
    );
  }
  return problems;
}
