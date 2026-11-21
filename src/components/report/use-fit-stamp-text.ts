import { useEffect, type RefObject } from "react";
import { STAMP_STRETCH, fitStretch } from "@/lib/outlook/stamp-geometry";

const FITTED = "text[data-fit], textPath[data-fit]";
/** Width doesn't track stretch exactly, so narrow twice before squeezing. */
const NARROWING_PASSES = 2;

/** Null when the text can't be measured: hidden (length 0) or not laid out. */
function measure(text: SVGTextContentElement): number | null {
  try {
    const width = text.getComputedTextLength();
    return width > 0 ? width : null;
  } catch {
    return null;
  }
}

function clearFit(text: SVGTextContentElement): void {
  text.removeAttribute("textLength");
  text.removeAttribute("lengthAdjust");
  text.style.fontStretch = "";
}

/**
 * Starts from the wide default, narrows along Archivo's width axis, and
 * squeezes with textLength only if the narrowest cut is still too wide.
 * Unmeasurable text keeps the stretch the server rendered.
 */
function fitText(text: SVGTextContentElement): void {
  clearFit(text);
  const maxWidth = Number(text.dataset.fit);
  let stretch = STAMP_STRETCH;
  text.style.fontStretch = `${stretch}%`;
  let width = measure(text);
  if (width === null) {
    clearFit(text);
    return;
  }
  for (let pass = 0; pass < NARROWING_PASSES && width > maxWidth; pass++) {
    stretch = fitStretch(stretch, width, maxWidth);
    text.style.fontStretch = `${stretch}%`;
    width = measure(text) ?? width;
  }
  if (width > maxWidth) {
    text.setAttribute("textLength", String(maxWidth));
    text.setAttribute("lengthAdjust", "spacingAndGlyphs");
  }
}

function fitTexts(svg: SVGSVGElement): void {
  svg.querySelectorAll<SVGTextContentElement>(FITTED).forEach(fitText);
}

/**
 * Fits every `data-fit` text (width in user units) once fonts are ready.
 * Stamp sizes are estimates, so a wide glyph or a font that loads late could
 * otherwise run past the frame (spec 8). No dependency list: the text can
 * change on any render, and the work is a handful of measurements.
 */
export function useFitStampText(ref: RefObject<SVGSVGElement | null>): void {
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let active = true;
    const refit = () => {
      if (active) fitTexts(svg);
    };
    refit();
    const fonts = document.fonts;
    if (!fonts) return;
    fonts.ready.then(refit);
    // ready can settle before the stamp face is first requested.
    fonts.addEventListener("loadingdone", refit);
    return () => {
      active = false;
      fonts.removeEventListener("loadingdone", refit);
    };
  });
}
