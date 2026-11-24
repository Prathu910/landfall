import { describe, expect, it } from "vitest";
import { articleLd, collectionPageLd, datasetLd } from "./json-ld";

describe("datasetLd", () => {
  it("credits Home Affairs under CC BY 3.0 AU", () => {
    const ld = datasetLd({
      name: "SkillSelect EOI data, October 2026",
      description: "Pools and invitations.",
      url: "https://migratelens.com/updates/2026-10/",
      temporalCoverage: "2026-10",
      dateModified: "2026-11-17",
    }) as Record<string, unknown>;
    expect(ld).toMatchObject({
      "@type": "Dataset",
      temporalCoverage: "2026-10",
      isAccessibleForFree: true,
      license: "https://creativecommons.org/licenses/by/3.0/au/",
      creator: { "@type": "Organization", name: "Department of Home Affairs" },
      dateModified: "2026-11-17",
    });
  });
});

describe("articleLd", () => {
  const base = {
    headline: "H",
    description: "D",
    url: "https://migratelens.com/x/",
    dateModified: "2026-11-24",
    citations: [],
  };
  it("adds datePublished and image only when given", () => {
    expect(articleLd(base)).not.toHaveProperty("datePublished");
    expect(articleLd(base)).not.toHaveProperty("image");
    expect(
      articleLd({ ...base, datePublished: "2026-11-20", image: "https://i/" }),
    ).toMatchObject({ datePublished: "2026-11-20", image: "https://i/" });
  });
});

describe("collectionPageLd", () => {
  it("lists its pages in order", () => {
    const ld = collectionPageLd({
      name: "SkillSelect monthly updates",
      description: "Every month.",
      url: "https://migratelens.com/updates/",
      items: [
        {
          name: "October 2026",
          url: "https://migratelens.com/updates/2026-10/",
        },
      ],
    }) as { "@type": string; mainEntity: Record<string, unknown> };
    expect(ld["@type"]).toBe("CollectionPage");
    expect(ld.mainEntity).toMatchObject({
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "October 2026",
          url: "https://migratelens.com/updates/2026-10/",
        },
      ],
    });
  });
});
