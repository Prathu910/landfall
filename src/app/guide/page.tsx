import type { Metadata } from "next";
import { Route } from "lucide-react";
import { stateRuleData } from "@/components/data/state-rule-data";
import { GuideAnswer } from "@/components/guide/guide-answer";
import { GuideContents } from "@/components/guide/guide-contents";
import page from "@/components/guide/guide-page.module.css";
import { GuideSources } from "@/components/guide/guide-sources";
import { GuideTimeline } from "@/components/guide/guide-timeline";
import {
  LazyCostEstimator,
  LazyHubQuickCheck,
} from "@/components/guide/lazy-tools";
import { PathPicker } from "@/components/guide/path-picker";
import { PointsChanges } from "@/components/guide/points-changes";
import { VisaCards } from "@/components/guide/visa-cards";
import { VisaCompare } from "@/components/guide/visa-compare";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { OccupationFaq } from "@/components/occupation/occupation-faq";
import { FEES } from "@/data/guide/fees";
import { POINTS_CHANGES } from "@/data/guide/points-changes";
import { GUIDE_CHECKED_AT, SOURCE_LABELS, SOURCES } from "@/data/guide/sources";
import { GUIDE_STEPS } from "@/data/guide/steps";
import { VISA_GUIDES } from "@/data/guide/visas";
import { compareRows } from "@/lib/guide/compare";
import { federalCounts, hubFaq } from "@/lib/guide/faq";
import { GUIDE_PAGES, directAnswer, guideJsonLd } from "@/lib/guide/meta";
import { sourceList } from "@/lib/guide/sources-list";
import { formatDate, localToday } from "@/lib/migration";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/page-meta";
import { loadLatestRound } from "@/lib/updates/load-server";

const PAGE = GUIDE_PAGES.hub;

export const metadata: Metadata = pageMetadata({
  path: PAGE.path,
  title: PAGE.title,
  description: PAGE.description,
  type: "article",
  modifiedTime: GUIDE_CHECKED_AT,
});

const CONTENTS = [
  { id: "path", label: "Which path fits you" },
  { id: "visas", label: "The three visas" },
  { id: "steps", label: "Step by step" },
  { id: "points", label: "Points and basics" },
  { id: "costs", label: "Costs" },
  { id: "points-test", label: "Points-test changes" },
  { id: "faq", label: "Questions" },
  { id: "sources", label: "Sources" },
];

export default function GuideHubPage() {
  const counts = federalCounts(stateRuleData.federal);
  const faq = hubFaq(FEES, GUIDE_STEPS, GUIDE_CHECKED_AT, loadLatestRound());
  const pages = (Object.keys(SOURCES) as (keyof typeof SOURCES)[]).map(
    (key) => ({ label: SOURCE_LABELS[key], href: SOURCES[key] }),
  );
  const sources = sourceList(pages, FEES, GUIDE_CHECKED_AT);
  const buildDate = localToday();
  const ld = guideJsonLd(
    PAGE,
    faq,
    GUIDE_CHECKED_AT,
    sources.map((s) => s.href),
    GUIDE_STEPS,
  );
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb={PAGE.crumb}
          eyebrow="Australian skilled PR, step by step"
          icon={Route}
          title={PAGE.heading}
          intro="Three visas, one points test. The route from choosing your occupation to a visa decision, with the official rule, who runs each step and what it costs."
          meta={[
            <>
              Checked{" "}
              <time dateTime={GUIDE_CHECKED_AT}>
                {formatDate(GUIDE_CHECKED_AT)}
              </time>
            </>,
            <>
              Fees as at{" "}
              <time dateTime={FEES.feesAsAt}>{formatDate(FEES.feesAsAt)}</time>
            </>,
            "Sources: Home Affairs and official bodies",
          ]}
        />
        <GuideAnswer
          answer={directAnswer("hub", GUIDE_CHECKED_AT, counts)}
          checkedAt={GUIDE_CHECKED_AT}
          feesAsAt={FEES.feesAsAt}
        />
        <GuideContents items={CONTENTS} />
        <section id="path" className={page.section} aria-labelledby="path-h">
          <h2 id="path-h">Which path fits you?</h2>
          <p className={page.sectionIntro}>
            Tell us where you are and your occupation. We check it against the
            Home Affairs list for each visa and the state lists we import.
          </p>
          <div className={page.panel}>
            <PathPicker />
          </div>
        </section>
        <section id="visas" className={page.section} aria-labelledby="visas-h">
          <h2 id="visas-h">The three visas</h2>
          <p className={page.sectionIntro}>
            All three use the same points test and the same SkillSelect EOI.
            They differ in who nominates you, where you live and when you become
            permanent.
          </p>
          <VisaCompare rows={compareRows(FEES, counts)} />
          <h3 className={page.subhead}>Read a visa guide</h3>
          <VisaCards guides={Object.values(VISA_GUIDES)} />
        </section>
        <section id="steps" className={page.section} aria-labelledby="steps-h">
          <h2 id="steps-h">Step by step</h2>
          <p className={page.sectionIntro}>
            Ten steps, in order. A dashed step applies to the 190 and 491 only.
            We give a time only where Home Affairs publishes one.
          </p>
          <GuideTimeline steps={GUIDE_STEPS} />
        </section>
        <section
          id="points"
          className={page.section}
          aria-labelledby="points-h"
        >
          <h2 id="points-h">Check your points and the basics</h2>
          <p className={page.sectionIntro}>
            A quick estimate with the current Home Affairs points table, and the
            basic federal requirements: age, English, skills assessment,
            occupation list and 65 points.
          </p>
          <div className={page.panel}>
            <LazyHubQuickCheck buildDate={buildDate} />
          </div>
        </section>
        <section id="costs" className={page.section} aria-labelledby="costs-h">
          <h2 id="costs-h">What it costs</h2>
          <p className={page.sectionIntro}>
            Official fees from each provider’s own page, in the currency it
            charges. Where we couldn’t read a page, we show no figure and link
            it instead.
          </p>
          <div className={page.panel}>
            <LazyCostEstimator buildDate={buildDate} />
          </div>
        </section>
        <section
          id="points-test"
          className={page.section}
          aria-labelledby="points-test-h"
        >
          <h2 id="points-test-h">Is the points test changing?</h2>
          <p className={page.sectionIntro}>
            A reform has been announced but not published. Until Home Affairs
            publishes a new table, the current one applies, and it is the one we
            use.
          </p>
          <PointsChanges changes={POINTS_CHANGES} />
        </section>
        <section id="faq" className={page.section} aria-labelledby="faq-h">
          <h2 id="faq-h">Common questions</h2>
          <OccupationFaq items={faq} />
        </section>
        <section
          id="sources"
          className={page.section}
          aria-labelledby="sources-h"
        >
          <h2 id="sources-h">Sources</h2>
          <p className={page.sectionIntro}>
            Every rule and fee on this page comes from these official pages.
          </p>
          <GuideSources sources={sources} />
        </section>
        {ld.map((obj, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
          />
        ))}
      </div>
    </main>
  );
}
