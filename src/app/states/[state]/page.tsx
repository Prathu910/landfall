import type { Metadata } from "next";
import type { BandTone } from "@/components/updates/recap-band";
import { RecapCta } from "@/components/updates/recap-cta";
import { RecapFaq } from "@/components/updates/recap-faq";
import { StateSection } from "@/components/updates/state-section";
import { StateGlance } from "@/components/state-page/state-glance";
import { StateHero } from "@/components/state-page/state-hero";
import { StateMethod } from "@/components/state-page/state-method";
import { StateMonthsSection } from "@/components/state-page/state-months-section";
import { StateOccupationsSection } from "@/components/state-page/state-occupations-section";
import { StatePointsSection } from "@/components/state-page/state-points-section";
import { StateProgramSection } from "@/components/state-page/state-program-section";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/page-meta";
import { SITE_INDEXABLE } from "@/lib/site";
import { loadStatePageView } from "@/lib/state-page/load-server";
import {
  isStateIndexable,
  stateDescription,
  stateJsonLd,
  stateModified,
  stateTitle,
} from "@/lib/state-page/meta";
import { STATE_PAGES, stateFromSlug } from "@/lib/state-page/slug";
import type { StatePageView } from "@/lib/state-page/view";
import styles from "./page.module.css";

export const dynamicParams = false;

type Props = { params: Promise<{ state: string }> };

export function generateStaticParams() {
  return STATE_PAGES.map((page) => ({ state: page.slug }));
}

async function viewFor(params: Props["params"]): Promise<StatePageView> {
  const slug = (await params).state;
  const code = stateFromSlug(slug);
  if (!code) throw new Error(`No state page for ${slug}`);
  return loadStatePageView(code);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const view = await viewFor(params);
  return pageMetadata({
    path: view.page.path,
    // The title already carries the brand when it fits.
    title: { absolute: stateTitle(view) },
    description: stateDescription(view),
    type: "article",
    modifiedTime: stateModified(view),
    // A page with nothing published still links the other states: follow.
    robots:
      SITE_INDEXABLE && isStateIndexable(view)
        ? undefined
        : { index: false, follow: SITE_INDEXABLE },
  });
}

/** The bands in order (spec 5), alternating paper and desk after the sage hero. */
const KINDS = [
  "glance",
  "months",
  "points",
  "occupations",
  "program",
  "report",
  "compare190",
  "compare491",
  "faq",
  "method",
] as const;

type Kind = (typeof KINDS)[number];

function StateBand({
  kind,
  tone,
  view,
}: {
  kind: Kind;
  tone: BandTone;
  view: StatePageView;
}) {
  const { page, facts } = view;
  switch (kind) {
    case "glance":
      return (
        <StateGlance
          tone={tone}
          title={view.titles.glance}
          glance={view.glance}
        />
      );
    case "months":
      return (
        <StateMonthsSection
          tone={tone}
          title={view.titles.months}
          months={view.months}
        />
      );
    case "points":
      return (
        <StatePointsSection
          tone={tone}
          title={view.titles.points.title}
          lead={view.titles.points.lead}
          charts={view.scores}
        />
      );
    case "occupations":
      return (
        <StateOccupationsSection
          tone={tone}
          title={view.titles.occupations.title}
          lead={view.titles.occupations.lead}
          tables={view.occupations}
          listLink={view.titles.occupations.listLink}
        />
      );
    case "program":
      return (
        <StateProgramSection
          tone={tone}
          title={view.titles.program}
          program={view.program}
        />
      );
    case "report":
      return (
        <RecapCta
          tone={tone}
          id="report"
          heading={view.report.heading}
          text={view.report.text}
          stamp={REPORT_STAMP}
          headingId="report-heading"
        />
      );
    case "compare190":
      return <StateSection tone={tone} view={view.compare[0]} />;
    case "compare491":
      return <StateSection tone={tone} view={view.compare[1]} />;
    case "faq":
      return <RecapFaq tone={tone} title={view.titles.faq} faq={view.faq} />;
    case "method":
      return (
        <StateMethod
          tone={tone}
          method={view.method}
          current={page.code}
          sources={[
            {
              text: "SkillSelect EOI data",
              href: facts.manifest.sources.dashboard,
            },
            {
              text: "Invitation rounds page",
              href: facts.manifest.sources.currentRounds,
            },
            { text: `${page.fullName} official page`, href: facts.card.url },
          ]}
        />
      );
  }
}

const REPORT_STAMP = {
  top: "MIGRATELENS",
  word: "YOUR STATE OUTLOOK",
  bottom: "190 · 491",
};

export default async function StatePage({ params }: Props) {
  const view = await viewFor(params);
  return (
    <main id="main" className={styles.page}>
      <StateHero view={view} />
      {KINDS.map((kind, index) => (
        <StateBand
          key={kind}
          kind={kind}
          tone={index % 2 === 0 ? "paper" : "desk"}
          view={view}
        />
      ))}
      {stateJsonLd(view).map((obj, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
    </main>
  );
}
