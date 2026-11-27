import { describe, expect, it } from "vitest";
import { OG_LOCALE, pageMetadata, SITE_OG_IMAGE } from "./page-meta";

describe("pageMetadata", () => {
  it("restates the whole Open Graph object with the canonical URL", () => {
    const meta = pageMetadata({
      path: "/states/",
      title: "States",
      description: "About the states.",
    });
    expect(meta.alternates).toEqual({ canonical: "/states/" });
    expect(meta.openGraph).toEqual({
      type: "website",
      url: "/states/",
      locale: OG_LOCALE,
      siteName: "MigrateLens",
      images: [SITE_OG_IMAGE],
    });
    expect(meta.robots).toBeUndefined();
  });
  it("dates an article and keeps a page's own image and robots", () => {
    const image = { ...SITE_OG_IMAGE, url: "/social/2026-10/og.png" };
    const meta = pageMetadata({
      path: "/updates/2026-10/",
      title: { absolute: "October" },
      description: "October.",
      type: "article",
      publishedTime: "2026-11-24",
      modifiedTime: "2026-11-25",
      image,
      robots: { index: false, follow: true },
    });
    expect(meta.title).toEqual({ absolute: "October" });
    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: "2026-11-24",
      modifiedTime: "2026-11-25",
      images: [image],
    });
    expect(meta.twitter).toEqual({
      card: "summary_large_image",
      images: [image],
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
  it("uses the Australian English locale", () => {
    expect(OG_LOCALE).toBe("en_AU");
  });
});
