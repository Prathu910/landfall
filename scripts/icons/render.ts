import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { iconSvg } from "../../src/components/brand/mark-geometry";

const root = resolve(__dirname, "..", "..");

/** Every raster icon, rendered from the logo geometry (audit T-P2-1). */
export const ICONS = [
  // Next's icon file conventions (src/app/): <link rel="icon"> and apple-touch-icon.
  { file: "src/app/icon.png", size: 512, rounded: true },
  // iOS rounds the corners itself and shows transparency as black.
  { file: "src/app/apple-icon.png", size: 180, rounded: false, opaque: true },
  // The web app manifest's icons.
  { file: "public/brand/icon-192.png", size: 192, rounded: true },
  {
    file: "public/brand/icon-maskable-512.png",
    size: 512,
    rounded: false,
    opaque: true,
    // The mark sits inside the maskable safe zone (the central 80% circle).
    markScale: 0.8,
  },
  // The Organization logo in JSON-LD: a square that reads on any background.
  {
    file: "public/brand/logo-512.png",
    size: 512,
    rounded: false,
    opaque: true,
  },
] as const;

/** favicon.ico holds these PNG sizes. */
export const FAVICON_SIZES = [16, 32, 48] as const;
export const FAVICON_FILE = "src/app/favicon.ico";

async function renderPng(
  size: number,
  rounded: boolean,
  opaque = false,
  markScale = 1,
): Promise<Buffer> {
  const image = sharp(Buffer.from(iconSvg({ size, rounded, markScale })));
  const png = opaque ? image.removeAlpha() : image;
  return png.png({ compressionLevel: 9 }).toBuffer();
}

/** An ICO file whose entries are PNG images (supported by every current browser). */
export function icoFromPngs(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main(): Promise<void> {
  for (const icon of ICONS) {
    const png = await renderPng(
      icon.size,
      icon.rounded,
      "opaque" in icon && icon.opaque,
      "markScale" in icon ? icon.markScale : 1,
    );
    writeFileSync(join(root, icon.file), png);
    console.log(`Wrote ${icon.file}`);
  }
  const favicons = await Promise.all(
    FAVICON_SIZES.map(async (size) => ({
      size,
      png: await renderPng(size, true),
    })),
  );
  writeFileSync(join(root, FAVICON_FILE), icoFromPngs(favicons));
  console.log(`Wrote ${FAVICON_FILE}`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
