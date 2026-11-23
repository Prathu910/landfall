import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { stateRuleData } from "@/components/data/state-rule-data";
import { CostEstimator } from "@/components/guide/cost-estimator";
import { GuideAnswer } from "@/components/guide/guide-answer";
import { GuideContents } from "@/components/guide/guide-contents";
import page from "@/components/guide/guide-page.module.css";
import { GuideSources } from "@/components/guide/guide-sources";
import { GuideTimeline } from "@/components/guide/guide-timeline";
import { QuickCheck } from "@/components/guide/quick-check";
import { VisaCards } from "@/components/guide/visa-cards";
import { VisaCompare } from "@/components/guide/visa-compare";
import { VisaRules } from "@/components/guide/visa-rules";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { OccupationFaq } from "@/components/occupation/occupation-faq";
import { FEES } from "@/data/guide/fees";
import { GUIDE_CHECKED_AT, SOURCE_LABELS, SOURCES } from "@/data/guide/sources";
import { GUIDE_STEPS } from "@/data/guide/steps";
import { VISA_GUIDES } from "@/data/guide/visas";
import type { Visa } from "@/lib/data/types";
import { compareRows } from "@/lib/guide/compare";
import { federalCounts, visaFaq } from "@/lib/guide/faq";
import {
  GUIDE_PAGES,
  GUIDE_VISAS,
  directAnswer,
  guideJsonLd,
} from "@/lib/guide/meta";
import { sourceList } from "@/lib/guide/sources-list";
import { formatDate, localToday } from "@/lib/migration";
import { serializeJsonLd } from "@/lib/seo/json-ld";

export const dynamicParams = false;

type Props = { params: Promise<{ visa: string }> };

export function generateStaticParams() {
  return GUIDE_VISAS.map((visa) => ({ visa }));
}

function requireVisa(value: string): Visa {
  const visa = GUIDE_VISAS.find((v) => v === value);
  if (!visa) throw new Error(`No guide for visa ${value}`);
  return visa;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = GUIDE_PAGES[requireVisa((await params).visa)];
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: guide.path },
  };
}

/** The official pages a visa guide cites. */
function visaSources(visa: Visa) {
  const keys: (keyof typeof SOURCES)[] = [
    visa === "189" ? "visa189" : visa === "190" ? "visa190" : "visa491",
    ...(visa === "491" ? (["visa191", "regionalAreas"] as const) : []),
    visa === "189"
      ? "pointsTable"
      : visa === "190"
        ? "pointsTable190"
        : "pointsTable491",
    "occupationList",
    "skillsAssessment",
    "competentEnglish",
    "skillSelect",
    "health",
    "pricing",
    "processingTimes",
  ];
  return keys.map((key) => ({ label: SOURCE_LABELS[key], href: SOURCES[key] }));
}

export default async function VisaGuidePage({ params }: Props) {
  const visa = requireVisa((await params).visa);
  const meta = GUIDE_PAGES[visa];
  const guide = VISA_GUIDES[visa];
  const counts = federalCounts(stateRuleData.federal);
  const faq = visaFaq(visa, FEES, counts);
  const steps = GUIDE_STEPS.filter((s) => s.appliesTo.includes(visa));
  const sources = sourceList(visaSources(visa), null, GUIDE_CHECKED_AT);
  const buildDate = localToday();
  const ld = guideJsonLd(
    meta,
    faq,
    GUIDE_CHECKED_AT,
    sources.map((s) => s.href),
  );
  const nominated = visa !== "189";
  const contents = [
    { id: "about", label: "Who it suits" },
    { id: "requirements", label: "Requirements" },
    { id: "nomination", label: nominated ? "Nomination" : "No nomination" },
    { id: "steps", label: "Steps" },
    { id: "points", label: "Points and basics" },
    { id: "costs", label: "Costs" },
    { id: "faq", label: "Questions" },
    { id: "sources", label: "Sources" },
  ];
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb={meta.crumb}
          trail={[{ href: "/guide/", label: GUIDE_PAGES.hub.crumb }]}
          eyebrow={`${guide.kind === "permanent" ? "Permanent" : "Provisional"} skilled visa`}
          icon={BadgeCheck}
          title={meta.heading}
          intro={guide.what}
          meta={[
            `Checked ${formatDate(GUIDE_CHECKED_AT)}`,
            `Fees as at ${formatDate(FEES.feesAsAt)}`,
            ...(counts ? [`${counts[visa]} occupations listed`] : []),
          ]}
        />
        <GuideAnswer
          answer={directAnswer(visa, GUIDE_CHECKED_AT, counts)}
          checkedAt={GUIDE_CHECKED_AT}
          feesAsAt={FEES.feesAsAt}
        />
        <GuideContents items={contents} />
        <section id="about" className={page.section} aria-labelledby="about-h">
          <h2 id="about-h">Who the {visa} suits</h2>
          <p className={page.sectionIntro}>{guide.name}.</p>
          <dl className={page.suits}>
            <div>
              <dt>In Australia</dt>
              <dd>{guide.suits.onshore}</dd>
            </div>
            <div>
              <dt>Outside Australia</dt>
              <dd>{guide.suits.offshore}</dd>
            </div>
          </dl>
        </section>
        <section
          id="requirements"
          className={page.section}
          aria-labelledby="requirements-h"
        >
          <h2 id="requirements-h">Official requirements</h2>
          <p className={page.sectionIntro}>
            The federal rules from the Home Affairs {visa} page.
            {nominated && " The nominating state adds its own."}
          </p>
          <VisaRules rules={guide.requirements} />
        </section>
        <section
          id="nomination"
          className={page.section}
          aria-labelledby="nomination-h"
        >
          <h2 id="nomination-h">
            {nominated ? "State nomination" : "No nomination needed"}
          </h2>
          <p className={page.sectionIntro}>
            {nominated ? (
              <>
                How nomination works for the {visa}, and how the 189, 190 and
                491 compare. Each state’s program is on{" "}
                <Link href="/states/">the states page</Link>.
              </>
            ) : (
              "The 189 is the independent route; the 190 and 491 add nomination points."
            )}
          </p>
          <VisaRules rules={[...guide.nomination, ...guide.after]} />
          <h3 className={page.subhead}>The three visas compared</h3>
          <VisaCompare rows={compareRows(FEES, counts)} current={visa} />
        </section>
        <section id="steps" className={page.section} aria-labelledby="steps-h">
          <h2 id="steps-h">Steps to a {visa}</h2>
          <p className={page.sectionIntro}>
            The same route as the full guide
            {nominated
              ? ", including state nomination"
              : ", without the state nomination step"}
            . We give a time only where Home Affairs publishes one.
          </p>
          <GuideTimeline steps={steps} />
        </section>
        <section
          id="points"
          className={page.section}
          aria-labelledby="points-h"
        >
          <h2 id="points-h">Check your points for the {visa}</h2>
          <p className={page.sectionIntro}>
            Pick your occupation to see its published {visa} evidence on its
            occupation page, or browse{" "}
            <Link href="/occupations/">every occupation</Link>.
          </p>
          <div className={page.panel}>
            <QuickCheck
              buildDate={buildDate}
              focusVisa={visa}
              evidenceAnchor={guide.evidenceAnchor}
            />
          </div>
        </section>
        <section id="costs" className={page.section} aria-labelledby="costs-h">
          <h2 id="costs-h">What the {visa} costs</h2>
          <p className={page.sectionIntro}>
            Official fees in the currency each provider charges. Where we
            couldn’t read a page, we show no figure and link it instead.
          </p>
          <div className={page.panel}>
            <CostEstimator buildDate={buildDate} visa={visa} />
          </div>
        </section>
        <section id="faq" className={page.section} aria-labelledby="faq-h">
          <h2 id="faq-h">Common questions about the {visa}</h2>
          <OccupationFaq items={faq} />
        </section>
        <section
          id="sources"
          className={page.section}
          aria-labelledby="sources-h"
        >
          <h2 id="sources-h">Sources</h2>
          <GuideSources sources={sources} />
          <h3 className={page.subhead}>Other visa guides</h3>
          <VisaCards guides={Object.values(VISA_GUIDES)} exclude={visa} />
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
