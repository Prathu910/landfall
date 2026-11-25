import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { loadRecap } from "../../src/lib/updates/load-server";
import { checkLimits, quantise } from "./compress";
import { manifestPath, monthSetJobs, setManifest } from "./jobs";

const KB = 1024;

describe("checkLimits", () => {
  it("names an image over 300 KB", () => {
    expect(checkLimits([{ path: "a.png", bytes: 300 * KB + 1 }])).toEqual([
      "a.png is 300.0 KB, over the 300 KB limit",
    ]);
  });

  it("accepts an image of exactly 300 KB", () => {
    expect(checkLimits([{ path: "a.png", bytes: 300 * KB }])).toEqual([]);
  });

  it("names a set over 2.5 MB", () => {
    const files = Array.from({ length: 13 }, (_, i) => ({
      path: `${i}.png`,
      bytes: 200 * KB,
    }));
    expect(checkLimits(files)).toEqual([
      "set is 2.5 MB, over the 2.5 MB limit",
    ]);
  });

  it("accepts the measured month set size", () => {
    const files = Array.from({ length: 13 }, (_, i) => ({
      path: `${i}.png`,
      bytes: 190 * KB,
    }));
    expect(checkLimits(files)).toEqual([]);
  });
});

describe("quantise", () => {
  it("keeps the size and writes a palette PNG", async () => {
    const raw = await sharp({
      create: {
        width: 64,
        height: 48,
        channels: 3,
        background: { r: 20, g: 90, b: 60 },
      },
    })
      .png()
      .toBuffer();
    const out = await quantise(raw);
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([64, 48, "png"]);
    expect(meta.isPalette).toBe(true);
  });
});

describe("set manifest", () => {
  const facts = loadRecap("2026-10");
  const args = { month: "2026-10", set: "month" as const };
  const jobs = monthSetJobs(facts);

  it("never writes into a round folder when rendering the month set", () => {
    expect(jobs.every((job) => !job.out.includes("/round-"))).toBe(true);
    expect(manifestPath(jobs)).toBe("public/social/2026-10/month/set.json");
  });

  it("lists every image with alt text, and the reused round files", () => {
    const manifest = setManifest(facts, args, jobs);
    expect(manifest.kind).toBe("month");
    expect(manifest.round).toBeNull();
    expect(manifest.images).toHaveLength(jobs.length);
    expect(manifest.images.every((image) => image.alt.length > 0)).toBe(true);
    expect(manifest.reused).toEqual([
      expect.stringMatching(/\/round-[\d-]+\/round-light\.png$/),
      expect.stringMatching(/\/round-[\d-]+\/round-dark\.png$/),
    ]);
    expect(manifest.caption).toContain("migratelens.com/updates/2026-10/");
  });
});
