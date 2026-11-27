import type { Metadata } from "next";
import { Info } from "lucide-react";
import { AboutSections } from "@/components/about/about-sections";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { JsonLd } from "@/components/seo/json-ld";
import { ABOUT_INTRO, ABOUT_SECTIONS } from "@/lib/about/copy";
import { loadManifest } from "@/lib/data/load-server";
import { formatDate } from "@/lib/migration";
import { formatMonth } from "@/lib/report/copy";
import { sitePageMetadata } from "@/lib/seo/page-meta";
import { ABOUT_PAGE, sitePageJsonLd } from "@/lib/seo/site-pages";

export const metadata: Metadata = sitePageMetadata(ABOUT_PAGE);

export default function AboutPage() {
  const { asAt, checkedAt } = loadManifest();
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb="About"
          eyebrow="About MigrateLens"
          icon={Info}
          title="Independent, dated and checkable"
          intro={ABOUT_INTRO}
          meta={[
            <>
              SkillSelect data to{" "}
              <time dateTime={asAt}>{formatMonth(asAt)}</time>
            </>,
            <>
              Sources checked{" "}
              <time dateTime={checkedAt}>{formatDate(checkedAt)}</time>
            </>,
          ]}
        />
        <AboutSections sections={ABOUT_SECTIONS} />
      </div>
      <JsonLd
        data={sitePageJsonLd(ABOUT_PAGE, {
          type: "AboutPage",
          dateModified: checkedAt,
        })}
      />
    </main>
  );
}
