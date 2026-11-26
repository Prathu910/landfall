import type { Metadata } from "next";
import Link from "next/link";
import { BookA } from "lucide-react";
import { GlossaryList } from "@/components/guide/glossary-list";
import page from "@/components/guide/guide-page.module.css";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { JsonLd } from "@/components/seo/json-ld";
import { GUIDE_CHECKED_AT } from "@/data/guide/sources";
import { loadManifest } from "@/lib/data/load-server";
import {
  GLOSSARY_PAGE as PAGE,
  glossaryJsonLd,
  glossaryTerms,
} from "@/lib/guide/glossary";
import { GUIDE_PAGES } from "@/lib/guide/meta";
import { formatDate } from "@/lib/migration";
import { pageMetadata } from "@/lib/seo/page-meta";

export const metadata: Metadata = pageMetadata({
  path: PAGE.path,
  title: PAGE.title,
  description: PAGE.description,
  type: "article",
  modifiedTime: GUIDE_CHECKED_AT,
  publishedTime: PAGE.publishedAt,
});

export default function GlossaryPage() {
  const terms = glossaryTerms(loadManifest().sources);
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb={PAGE.crumb}
          trail={[{ href: "/guide/", label: GUIDE_PAGES.hub.crumb }]}
          eyebrow="Words used on MigrateLens"
          icon={BookA}
          title={PAGE.heading}
          intro={
            <>
              The terms used for the 189, 190 and 491 visas and in SkillSelect
              data, one sentence each, with the page each comes from. The{" "}
              <Link href="/guide/">PR guide</Link> puts them in order, step by
              step.
            </>
          }
          meta={[
            <>
              Checked{" "}
              <time dateTime={GUIDE_CHECKED_AT}>
                {formatDate(GUIDE_CHECKED_AT)}
              </time>
            </>,
            `${terms.length} terms`,
          ]}
        />
        <section className={page.section} aria-label="Terms, A to Z">
          <GlossaryList terms={terms} />
        </section>
      </div>
      <JsonLd data={glossaryJsonLd(terms)} />
    </main>
  );
}
