import { describe, expect, it } from "vitest";
import {
  articleLd,
  collectionPageLd,
  datasetLd,
  organizationLd,
  ORGANIZATION_ID,
  serializeJsonLd,
  webPageLd,
  websiteLd,
  WEBSITE_ID,
} from "./json-ld";

const SITE = "https://migratelens.com";

describe("the site entity", () => {
  it("is one Organization with a logo, contact and address", () => {
    expect(organizationLd()).toMatchObject({
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "MigrateLens",
      url: `${SITE}/`,
      logo: { url: `${SITE}/brand/logo-512.png`, width: 512, height: 512 },
      email: "hello@migratelens.com",
      address: { addressLocality: "Ahmedabad", addressCountry: "IN" },
      publishingPrinciples: `${SITE}/about/`,
    });
    expect(organizationLd()).not.toHaveProperty("sameAs");
  });
  it("is one WebSite published by it, with no search action", () => {
    const site = websiteLd();
    expect(site).toMatchObject({
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "MigrateLens",
      alternateName: "Migrate Lens",
      publisher: { "@id": ORGANIZATION_ID },
    });
    expect(site).not.toHaveProperty("potentialAction");
  });
  it("puts each web page in the site", () => {
    expect(
      webPageLd({
        type: "CollectionPage",
        name: "Occupations",
        description: "D",
        url: `${SITE}/occupations/`,
      }),
    ).toMatchObject({
      "@type": "CollectionPage",
      "@id": `${SITE}/occupations/`,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      inLanguage: "en-AU",
    });
  });
  it("makes the organisation the About page's main entity", () => {
    const about = webPageLd({
      type: "AboutPage",
      name: "About",
      description: "D",
      url: `${SITE}/about/`,
    });
    expect(about).toMatchObject({ mainEntity: { "@id": ORGANIZATION_ID } });
    expect(
      webPageLd({ name: "Check", description: "D", url: `${SITE}/check/` }),
    ).not.toHaveProperty("mainEntity");
  });
  it("points the organisation's publishing principles at the About page", () => {
    expect(organizationLd()).toMatchObject({
      publishingPrinciples: `${SITE}/about/`,
    });
  });
});

const dataset = {
  name: "SkillSelect EOI data, October 2026",
  description: "Pools and invitations.",
  url: `${SITE}/updates/2026-10/`,
  temporalCoverage: "2026-10",
  dateModified: "2026-11-17",
  version: "skillselect-2026-10-31",
  isBasedOn: ["https://example.gov.au/"],
  variableMeasured: ["EOIs by points"],
  catalog: { name: "Updates", url: `${SITE}/updates/` },
};

describe("datasetLd", () => {
  it("credits Home Affairs under CC BY 3.0 AU and refers to the publisher", () => {
    expect(datasetLd(dataset)).toMatchObject({
      "@type": "Dataset",
      temporalCoverage: "2026-10",
      isAccessibleForFree: true,
      license: "https://creativecommons.org/licenses/by/3.0/au/",
      creator: {
        "@type": "GovernmentOrganization",
        name: "Department of Home Affairs",
      },
      publisher: { "@id": ORGANIZATION_ID },
      includedInDataCatalog: { "@type": "DataCatalog", name: "Updates" },
      spatialCoverage: { name: "Australia" },
      dateModified: "2026-11-17",
    });
  });
  it("lists a download only when given", () => {
    expect(datasetLd(dataset)).not.toHaveProperty("distribution");
    expect(
      datasetLd({
        ...dataset,
        distribution: { contentUrl: `${SITE}/d.json`, description: "Ours." },
      }),
    ).toMatchObject({
      distribution: [{ "@type": "DataDownload", contentUrl: `${SITE}/d.json` }],
    });
  });
  it("covers a state as an area within Australia when given one", () => {
    expect(
      datasetLd({ ...dataset, spatialCoverage: "Tasmania" }),
    ).toMatchObject({
      spatialCoverage: {
        "@type": "AdministrativeArea",
        name: "Tasmania",
        containedInPlace: { "@type": "Country", name: "Australia" },
      },
    });
  });
});

describe("articleLd", () => {
  const base = {
    headline: "H",
    description: "D",
    url: `${SITE}/x/`,
    dateModified: "2026-11-24",
    citations: [],
  };
  it("adds datePublished only when given and always has an image", () => {
    expect(articleLd(base)).not.toHaveProperty("datePublished");
    expect(articleLd(base)).toMatchObject({ image: `${SITE}/og.png` });
    expect(
      articleLd({ ...base, datePublished: "2026-11-20", image: "https://i/" }),
    ).toMatchObject({ datePublished: "2026-11-20", image: "https://i/" });
  });
  it("is written and published by the organisation, on its own page", () => {
    expect(articleLd(base)).toMatchObject({
      author: { "@type": "Organization", "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID, logo: { width: 512 } },
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/x/` },
    });
  });
});

describe("collectionPageLd", () => {
  it("lists its pages in order", () => {
    const ld = collectionPageLd({
      name: "SkillSelect monthly updates",
      description: "Every month.",
      url: `${SITE}/updates/`,
      items: [{ name: "October 2026", url: `${SITE}/updates/2026-10/` }],
    }) as { "@type": string; mainEntity: Record<string, unknown> };
    expect(ld["@type"]).toBe("CollectionPage");
    expect(ld.mainEntity).toMatchObject({
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "October 2026",
          url: `${SITE}/updates/2026-10/`,
        },
      ],
    });
  });
});

describe("serializeJsonLd", () => {
  it("cannot close its script tag early", () => {
    expect(serializeJsonLd({ text: "</script>" })).not.toContain("</");
  });
});
