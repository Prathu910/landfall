import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { iconSvg, markSvgBody } from "../../src/components/brand/mark-geometry";
import { webManifest } from "../../src/lib/brand/manifest";
import { FAVICON_FILE, FAVICON_SIZES, ICONS } from "./render";

const root = join(__dirname, "..", "..");
const read = (file: string) => readFileSync(join(root, file));

/** Width, height and colour type from a PNG's IHDR chunk. */
function pngInfo(png: Buffer) {
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    // 2 = RGB, 6 = RGBA.
    colourType: png.readUInt8(25),
  };
}

describe("raster icons", () => {
  it("are drawn from the logo geometry", () => {
    expect(iconSvg({ size: 32, rounded: true })).toContain(markSvgBody());
    expect(iconSvg({ size: 32, rounded: true, markScale: 0.8 })).toContain(
      "scale(0.8)",
    );
  });
  it("are committed at their sizes, opaque where they must be", () => {
    for (const icon of ICONS) {
      const info = pngInfo(read(icon.file));
      expect([info.width, info.height]).toEqual([icon.size, icon.size]);
      if ("opaque" in icon && icon.opaque) expect(info.colourType).toBe(2);
    }
  });
  it("puts 16, 32 and 48 pixel PNGs in favicon.ico", () => {
    const ico = read(FAVICON_FILE);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(FAVICON_SIZES.length);
    FAVICON_SIZES.forEach((size, i) => {
      const entry = 6 + 16 * i;
      expect(ico.readUInt8(entry)).toBe(size);
      const offset = ico.readUInt32LE(entry + 12);
      const length = ico.readUInt32LE(entry + 8);
      const info = pngInfo(ico.subarray(offset, offset + length));
      expect(info.width).toBe(size);
    });
  });
  it("lists only icons that exist in the manifest", () => {
    const manifest = webManifest();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("browser");
    for (const icon of manifest.icons ?? []) {
      const file = icon.src.startsWith("/brand/")
        ? `public${icon.src}`
        : `src/app${icon.src}`;
      expect(existsSync(join(root, file))).toBe(true);
      const [width] = (icon.sizes ?? "").split("x").map(Number);
      expect(pngInfo(read(file)).width).toBe(width);
    }
    expect(manifest.icons?.some((i) => i.purpose === "maskable")).toBe(true);
  });
});
