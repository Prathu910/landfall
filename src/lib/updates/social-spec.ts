/** Sizes, limits and fixed text for the monthly Instagram images (spec 6.7). */

export const FEED = { width: 1080, height: 1350 } as const;

/** Story canvas; no text or stamp in the top `safeTop` or bottom `safeBottom` px. */
export const STORY = {
  width: 1080,
  height: 1920,
  safeTop: 250,
  safeBottom: 340,
} as const;

export const OG = { width: 1200, height: 630 } as const;

/** The profile grid crops feed cards to about 3:4; keep cover text this wide. */
export const FEED_GRID_WIDTH = 1012;

export const IMAGE_LIMIT_BYTES = 300 * 1024;
export const SET_LIMIT_BYTES = 2.5 * 1024 * 1024;

/** Data months whose full image sets stay in `public/social/`. */
export const RETENTION_MONTHS = 3;

export const HANDLE = "@migratelens";
