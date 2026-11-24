import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { occupationIndex } from "@/components/data/occupation-index";
import { CompareSection } from "@/components/updates/compare-section";
import { MoversSection } from "@/components/updates/movers-section";
import type { BandTone } from "@/components/updates/recap-band";
import { RecapCta } from "@/components/updates/recap-cta";
import { RecapFaq } from "@/components/updates/recap-faq";
import { RecapHero } from "@/components/updates/recap-hero";
import { RecapMethod } from "@/components/updates/recap-method";
import { RoundSection } from "@/components/updates/round-section";
import { StateSection } from "@/components/updates/state-section";
import type { MonthKey } from "@/lib/data/types";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/site";
import { formatLongMonth } from "@/lib/updates/format";
import { listRecapMonths, loadRecap } from "@/lib/updates/load-server";
import { recapDescription, recapJsonLd, recapTitle } from "@/lib/updates/meta";
import { buildRecapView, type RecapView } from "@/lib/updates/recap-view";
import type { RecapFacts } from "@/lib/updates/types";
import styles from "./page.module.css";

export const dynamicParams = false;

type Props = { params: Promise<{ month: string }> };

/** Only occupations with data have a page; others stay unlinked. */
const OCCUPATION_PAGES: ReadonlySet<string> = new Set(
  occupationIndex.filter((e) => e.hasData).map((e) => e.code),
);

export function generateStaticParams() {
  return listRecapMonths().map((month) => ({ month }));
}

function requireMonth(value: string): MonthKey {
  const month = listRecapMonths().find((m) => m === value);
  if (!month) throw new Error(`No recap facts for ${value}`);
  return month;
}

/** The month's own card once Plan 2 renders it, else the site image. */
function ogImage(month: MonthKey): string {
  const own = `/social/${month}/og.png`;
  return existsSync(path.join(process.cwd(), "public", own)) ? own : "/og.png";
}

function recap(month: MonthKey): { facts: RecapFacts; view: RecapView } {
  const facts = loadRecap(month);
  const view = buildRecapView(facts, {
    recapMonths: listRecapMonths(),
    occupationPages: OCCUPATION_PAGES,
  });
  return { facts, view };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const month = requireMonth((await params).month);
  const { facts, view } = recap(month);
  const title = recapTitle(facts);
  const description = recapDescription(view);
  const image = {
    url: ogImage(month),
    width: 1200,
    height: 630,
    alt: view.hero.h1,
  };
  return {
    // The layout's "· MigrateLens" template would repeat the brand (R20).
    title: { absolute: title },
    description,
    alternates: { canonical: view.path },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description,
      url: view.path,
      images: [image],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

type SectionKind =
  "189" | "190" | "491" | "movers" | "compare" | "cta" | "method" | "faq";

/** The sections the month has ([R] and [D], spec 6.4), in the mockup's order. */
function sectionKinds(view: RecapView): SectionKind[] {
  const kinds: (SectionKind | false)[] = [
    (view.rounds.length > 0 || view.pool !== null) && "189",
    view.states !== null && "190",
    view.states !== null && "491",
    view.movers !== null && "movers",
    view.compare !== null && "compare",
    "cta",
    "method",
    "faq",
  ];
  return kinds.filter((kind) => kind !== false);
}

function RecapSection({
  kind,
  tone,
  view,
}: {
  kind: SectionKind;
  tone: BandTone;
  view: RecapView;
}) {
  switch (kind) {
    case "189":
      return (
        <RoundSection
          tone={tone}
          rounds={view.rounds}
          noRound={view.noRound}
          pool={view.pool}
          notable={view.notable}
          notListed={view.notListed}
          showCutoffMoves={view.movers === null}
        />
      );
    case "190":
    case "491":
      return (
        view.states && <StateSection tone={tone} view={view.states[kind]} />
      );
    case "movers":
      return view.movers && <MoversSection tone={tone} movers={view.movers} />;
    case "compare":
      return (
        view.compare && <CompareSection tone={tone} compare={view.compare} />
      );
    case "cta":
      return <RecapCta tone={tone} />;
    case "method":
      return <RecapMethod tone={tone} method={view.method} />;
    case "faq":
      return (
        <RecapFaq
          tone={tone}
          title={`${formatLongMonth(view.month)} SkillSelect questions`}
          faq={view.faq}
        />
      );
  }
}

export default async function RecapPage({ params }: Props) {
  const month = requireMonth((await params).month);
  const { facts, view } = recap(month);
  const ld = recapJsonLd(facts, view, ogImage(month));
  return (
    <main id="main" className={styles.page}>
      <RecapHero
        breadcrumb={view.breadcrumb}
        hero={view.hero}
        passport={view.passport}
      />
      {sectionKinds(view).map((kind, index) => (
        <RecapSection
          key={kind}
          kind={kind}
          tone={index % 2 === 0 ? "paper" : "desk"}
          view={view}
        />
      ))}
      {ld.map((obj, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(obj) }}
        />
      ))}
    </main>
  );
}
