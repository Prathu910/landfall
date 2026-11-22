import type { Metadata } from "next";
import Link from "next/link";
import { occupationIndex } from "@/components/data/occupation-index";
import { stateRuleData } from "@/components/data/state-rule-data";
import { OccupationEvidenceFooter } from "@/components/occupation/occupation-evidence-footer";
import { OccupationSectionNav } from "@/components/occupation/occupation-section-nav";
import { OccupationCheckPanel } from "@/components/occupation/occupation-check-panel";
import shell from "@/components/occupation/occupation-shell.module.css";
import { CohortBars } from "@/components/occupation/cohort-bars";
import { OccupationFaq } from "@/components/occupation/occupation-faq";
import { OccupationSummary } from "@/components/occupation/occupation-summary";
import { PoolTabs } from "@/components/occupation/pool-tabs";
import { RelatedOccupations } from "@/components/occupation/related-occupations";
import { RoundCards } from "@/components/occupation/round-cards";
import { StateTable } from "@/components/occupation/state-table";
import {
  loadManifest,
  loadOccupationCore,
  loadOccupationDetail,
} from "@/lib/data/load-server";
import type { OccupationCore, Visa } from "@/lib/data/types";
import { formatDate } from "@/lib/migration";
import {
  cohortNote,
  cohortRows,
  poolBars,
  poolTotalLabel,
  roundCards,
  roundsNote,
} from "@/lib/occupation-page/charts";
import { occupationFaq } from "@/lib/occupation-page/faq";
import {
  isIndexable,
  occupationJsonLd,
  pageDescription,
  pageTitle,
  relatedOccupations,
} from "@/lib/occupation-page/meta";
import {
  codeFromSlug,
  occupationPath,
  occupationSlug,
} from "@/lib/occupation-page/slug";
import { invitedHeading, stateRows } from "@/lib/occupation-page/states";
import {
  has189Rounds,
  occupationSummary,
  sourceLine,
  statusChips,
} from "@/lib/occupation-page/summary";
import { formatMonth } from "@/lib/report/copy";
import { SITE_INDEXABLE } from "@/lib/site";
import styles from "./page.module.css";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };
const VISAS: Visa[] = ["189", "190", "491"];

export function generateStaticParams() {
  return occupationIndex
    .filter((e) => e.hasData)
    .map((e) => ({ slug: occupationSlug(e) }));
}

function requireCore(slug: string): OccupationCore {
  const code = codeFromSlug(slug);
  const core = code ? loadOccupationCore(code) : null;
  if (!core) throw new Error(`No occupation data for slug ${slug}`);
  return core;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const core = requireCore((await params).slug);
  const detail = loadOccupationDetail(core.code);
  return {
    title: pageTitle(core),
    description: pageDescription(occupationSummary(core, detail)),
    alternates: { canonical: occupationPath(core) },
    robots:
      !SITE_INDEXABLE || !isIndexable(core)
        ? { index: false, follow: false }
        : undefined,
  };
}

function jsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function OccupationPage({ params }: Props) {
  const core = requireCore((await params).slug);
  const { code, name } = core;
  const detail = loadOccupationDetail(code);
  const manifest = loadManifest();
  const rows = stateRows(code, core, stateRuleData);
  const sentences = occupationSummary(core, detail);
  const faq = occupationFaq(core, rows);
  const cohorts = cohortRows(detail, core.asAt);
  const pools = Object.fromEntries(
    VISAS.map((v) => [v, core.pool[v] ? poolBars(core.pool[v]) : null]),
  ) as Record<Visa, ReturnType<typeof poolBars> | null>;
  const totals = Object.fromEntries(
    VISAS.map((v) => [v, poolTotalLabel(v, core.pool[v])]),
  ) as Record<Visa, string | null>;

  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <nav className={styles.crumb} aria-label="Breadcrumb">
          <Link href="/occupations/">Occupations</Link>
          <span aria-hidden="true"> › </span>
          <span aria-current="page">{name}</span>
        </nav>
        <header className={styles.header}>
          <div>
            <p className={shell.eyebrow}>
              AUSTRALIAN SKILLED MIGRATION · OCCUPATION RECORD
            </p>
            <h1 className={styles.title}>{name}</h1>
            <p className={styles.code}>ANZSCO {code}</p>
            <p className={styles.subtitle}>
              189 & 190 permanent visas · 491 provisional visa
            </p>
          </div>
          <dl className={styles.recordDate}>
            <div>
              <dt>DATA SNAPSHOT</dt>
              <dd>{formatMonth(core.asAt)}</dd>
            </div>
            <div>
              <dt>LAST UPDATED</dt>
              <dd>{formatDate(manifest.checkedAt)}</dd>
            </div>
          </dl>
        </header>
        <OccupationSummary
          chips={statusChips(core, stateRuleData.federal)}
          sentences={sentences}
          sourceLine={sourceLine(core)}
        />
        <OccupationSectionNav
          hasRounds={has189Rounds(core)}
          hasCohorts={Boolean(cohorts)}
        />
        <div className={styles.grid}>
          <aside className={styles.side}>
            <OccupationCheckPanel core={core} />
          </aside>
          <div className={styles.main}>
            <section aria-labelledby="pool-heading" className={styles.block}>
              <p className={styles.sectionLabel}>THE PUBLISHED POOL</p>
              <h2 id="pool-heading">Where the points sit.</h2>
              <p className={styles.sectionIntro}>
                Submitted EOIs by points score, as at {formatMonth(core.asAt)}.
                Each visa has its own pool; EOIs can appear in more than one.
              </p>
              <PoolTabs pools={pools} totals={totals} />
            </section>
            {has189Rounds(core) && (
              <section
                aria-labelledby="rounds-heading"
                className={styles.block}
              >
                <p className={styles.sectionLabel}>NATIONAL INVITATIONS</p>
                <h2 id="rounds-heading">Recent 189 rounds.</h2>
                <p className={styles.sectionIntro}>
                  Published minimum points for this occupation. “Not listed” is
                  an absent occupation row, not a zero-point cut-off.
                </p>
                <RoundCards
                  cards={roundCards(core.rounds189)}
                  note={roundsNote(core.rounds189)}
                />
              </section>
            )}
            {cohorts && (
              <section
                aria-labelledby="cohort-heading"
                className={styles.block}
              >
                <p className={styles.sectionLabel}>
                  FOLLOW THE SUBMISSION MONTHS
                </p>
                <h2 id="cohort-heading">Where recent 189 EOIs stand.</h2>
                <p className={styles.sectionIntro}>
                  {cohortNote(name, cohorts)}
                </p>
                <details className={styles.disclosure}>
                  <summary>See outcomes by submission month</summary>
                  <div className={styles.disclosureBody}>
                    <CohortBars
                      rows={cohorts}
                      note="A snapshot of EOI statuses, not the number of invitations issued during each month. Closed does not establish whether an EOI expired, was withdrawn or had another outcome. Masked segments use the published upper bound for their visual width."
                    />
                  </div>
                </details>
              </section>
            )}
            <section aria-labelledby="states-heading" className={styles.block}>
              <p className={styles.sectionLabel}>190 & PROVISIONAL 491</p>
              <h2 id="states-heading">Look at the state evidence.</h2>
              <p className={styles.sectionIntro}>
                A list entry is one part of the rules, not a finding that you
                are eligible. State nomination has separate residence, work and
                other requirements. National 189 rounds do not describe 190 or
                491 invitations.
              </p>
              <details className={styles.disclosure} open>
                <summary>Compare all eight states & territories</summary>
                <div className={styles.disclosureBody}>
                  <StateTable
                    rows={rows}
                    invitedHeading={invitedHeading(core)}
                  />
                </div>
              </details>
            </section>
            <section aria-labelledby="faq-heading" className={styles.block}>
              <p className={styles.sectionLabel}>THE USEFUL DETAILS</p>
              <h2 id="faq-heading">Common questions.</h2>
              <OccupationFaq items={faq} />
            </section>
            <RelatedOccupations
              items={relatedOccupations(code, occupationIndex)}
              unitGroup={code.slice(0, 4)}
            />
          </div>
        </div>
        <OccupationEvidenceFooter
          code={code}
          sourceText={sourceLine(core)}
          checkedAt={manifest.checkedAt}
          sources={manifest.sources}
          snapshotId={manifest.snapshotId}
          federalCheckedAt={stateRuleData.federal?.checkedAt}
        />
        {occupationJsonLd(core, faq, sentences, manifest.checkedAt).map(
          (obj, i) => (
            <script
              key={i}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: jsonLd(obj) }}
            />
          ),
        )}
      </div>
    </main>
  );
}
