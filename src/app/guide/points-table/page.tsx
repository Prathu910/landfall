import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "lucide-react";
import { GuideAnswer } from "@/components/guide/guide-answer";
import { GuideContents } from "@/components/guide/guide-contents";
import page from "@/components/guide/guide-page.module.css";
import { GuideSources } from "@/components/guide/guide-sources";
import { PointsChanges } from "@/components/guide/points-changes";
import { PointsFactorTable } from "@/components/guide/points-factor-table";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { OccupationFaq } from "@/components/occupation/occupation-faq";
import { JsonLd } from "@/components/seo/json-ld";
import { POINTS_CHANGES } from "@/data/guide/points-changes";
import { POINTS_TABLE } from "@/data/guide/points-table";
import { GUIDE_CHECKED_AT, SOURCE_LABELS, SOURCES } from "@/data/guide/sources";
import { GUIDE_PAGES } from "@/lib/guide/meta";
import {
  POINTS_TABLE_PAGE as PAGE,
  pointsTableAnswer,
  pointsTableFaq,
  pointsTableJsonLd,
} from "@/lib/guide/points-table";
import { sourceList } from "@/lib/guide/sources-list";
import { formatDate } from "@/lib/migration";
import { pageMetadata } from "@/lib/seo/page-meta";
import { loadLatestRound } from "@/lib/updates/load-server";

export const metadata: Metadata = pageMetadata({
  path: PAGE.path,
  title: PAGE.title,
  description: PAGE.description,
  type: "article",
  modifiedTime: GUIDE_CHECKED_AT,
  publishedTime: PAGE.publishedAt,
});

const SOURCE_KEYS = [
  "pointsTable",
  "pointsTable190",
  "pointsTable491",
] as const;

export default function PointsTablePage() {
  const faq = pointsTableFaq(POINTS_TABLE, loadLatestRound());
  const sources = sourceList(
    SOURCE_KEYS.map((key) => ({
      label: SOURCE_LABELS[key],
      href: SOURCES[key],
    })),
    null,
    GUIDE_CHECKED_AT,
  );
  const contents = [
    ...POINTS_TABLE.map((f) => ({ id: f.id, label: f.factor })),
    { id: "points-test", label: "Points-test changes" },
    { id: "faq", label: "Questions" },
    { id: "sources", label: "Sources" },
  ];
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb={PAGE.crumb}
          trail={[{ href: "/guide/", label: GUIDE_PAGES.hub.crumb }]}
          eyebrow="The points test"
          icon={Calculator}
          title={PAGE.heading}
          intro="Every factor in the Home Affairs points test and the points it gives. The 189, 190 and 491 share this table; only nomination differs."
          meta={[
            <>
              Checked{" "}
              <time dateTime={GUIDE_CHECKED_AT}>
                {formatDate(GUIDE_CHECKED_AT)}
              </time>
            </>,
            "Source: Home Affairs points table",
          ]}
        />
        <GuideAnswer
          answer={pointsTableAnswer(POINTS_TABLE)}
          checkedAt={GUIDE_CHECKED_AT}
        />
        <GuideContents items={contents} />
        {POINTS_TABLE.map((factor) => (
          <section
            key={factor.id}
            id={factor.id}
            className={page.section}
            aria-labelledby={`${factor.id}-h`}
          >
            <h2 id={`${factor.id}-h`}>{factor.question}</h2>
            <p className={page.sectionIntro}>{factor.note}</p>
            <PointsFactorTable factor={factor} />
          </section>
        ))}
        <section
          id="your-points"
          className={page.section}
          aria-labelledby="your-points-h"
        >
          <h2 id="your-points-h">What does the table give you?</h2>
          <p className={page.sectionIntro}>
            The <Link href="/check/">free points check</Link> adds up your
            points with this table, in your browser, and shows where they sit
            for the 189, 190 and 491. Each{" "}
            <Link href="/occupations/">occupation page</Link> shows the points
            recent 189 rounds invited.
          </p>
        </section>
        <section
          id="points-test"
          className={page.section}
          aria-labelledby="points-test-h"
        >
          <h2 id="points-test-h">Is the points test changing?</h2>
          <p className={page.sectionIntro}>
            A reform has been announced but not published. This is the current
            table, and it is the one MigrateLens uses until Home Affairs
            publishes a new one.
          </p>
          <PointsChanges changes={POINTS_CHANGES} />
        </section>
        <section id="faq" className={page.section} aria-labelledby="faq-h">
          <h2 id="faq-h">Common questions about points</h2>
          <OccupationFaq items={faq} />
        </section>
        <section
          id="sources"
          className={page.section}
          aria-labelledby="sources-h"
        >
          <h2 id="sources-h">Sources</h2>
          <GuideSources sources={sources} />
        </section>
      </div>
      <JsonLd
        data={pointsTableJsonLd(
          faq,
          GUIDE_CHECKED_AT,
          sources.map((s) => s.href),
        )}
      />
    </main>
  );
}
