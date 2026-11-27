import type { MetadataRoute } from "next";
import { SITE_NAME } from "../site";
import { SHELL_PALETTE } from "./palette";
import { THEME_COLOR } from "./viewport";

/**
 * The web app manifest (audit T-P2-1). The site is a website, not an
 * installable app, so `display` stays "browser"; the manifest names the site
 * and lists its icons for browsers and search engines. Colours are the
 * light theme's (a manifest has one value each).
 */
export function webManifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Australian skilled migration points for the 189, 190 and 491 visas, compared with published SkillSelect data.",
    start_url: "/",
    scope: "/",
    display: "browser",
    lang: "en-AU",
    theme_color: THEME_COLOR.light,
    background_color: SHELL_PALETTE.paper,
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
