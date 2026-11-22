import { SHELL_PALETTE } from "../../lib/brand/palette";

/** Open lens: a clear aperture and a bearing toward the upper right. */
export const MARK_COLOURS = {
  ink: SHELL_PALETTE.ink,
  reversed: SHELL_PALETTE.paper,
} as const;

export const MARK_VIEWBOX = "0 0 48 48";
export const MARK_PATHS = ["M40 18 A17 17 0 1 1 30 8", "M24 24 L40 8"] as const;
export const MARK_STROKE = 4.5;

/** Shared by downloadable assets, the favicon and the social-image renderer. */
export function markSvgBody(colour: string = MARK_COLOURS.ink): string {
  return `<g fill="none" stroke="${colour}" stroke-width="${MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round">${MARK_PATHS.map((d) => `<path d="${d}"/>`).join("")}</g>`;
}

export function faviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><rect width="48" height="48" rx="12" fill="${SHELL_PALETTE.sage}"/>${markSvgBody()}</svg>\n`;
}
