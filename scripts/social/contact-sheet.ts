/**
 * contact.png: every image of the launch pack as thumbnails, one row per
 * post, then the stories and the profile kit, for a quick visual review.
 */
import sharp from "sharp";
import { SHELL_PALETTE } from "../../src/lib/brand/palette";

const THUMB_WIDTH = 216;
const GAP = 12;

/** Image files (absolute paths) grouped in rows; returns the sheet as a PNG. */
export async function contactSheet(rows: string[][]): Promise<Buffer> {
  const thumbs = await Promise.all(
    rows.map((row) =>
      Promise.all(
        row.map(async (file) => {
          const image = sharp(file).resize({ width: THUMB_WIDTH });
          const buffer = await image.png().toBuffer();
          const { height = 0 } = await sharp(buffer).metadata();
          return { buffer, height };
        }),
      ),
    ),
  );
  const columns = Math.max(...rows.map((row) => row.length));
  const width = GAP + columns * (THUMB_WIDTH + GAP);
  const heights = thumbs.map((row) => Math.max(...row.map((t) => t.height)));
  const height = GAP + heights.reduce((sum, h) => sum + h + GAP, 0);
  const composites = thumbs.flatMap((row, r) => {
    const top = GAP + heights.slice(0, r).reduce((sum, h) => sum + h + GAP, 0);
    return row.map((thumb, c) => ({
      input: thumb.buffer,
      left: GAP + c * (THUMB_WIDTH + GAP),
      top,
    }));
  });
  return sharp({
    create: { width, height, channels: 3, background: SHELL_PALETTE.sage },
  })
    .composite(composites)
    .png({ palette: true, colours: 256 })
    .toBuffer();
}
