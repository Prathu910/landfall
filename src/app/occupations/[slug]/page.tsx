import type { Metadata } from "next";
import Link from "next/link";
import { occupationIndex } from "@/components/data/occupation-index";
import { stateRuleData } from "@/components/data/state-rule-data";
import { DroppedNote } from "@/components/occupation/dropped-note";
import { OccupationEvidenceFooter } from "@/components/occupation/occupation-evidence-footer";
import { OccupationSectionNav } from "@/components/occupation/occupation-section-nav";
import { OccupationCheckPanel } from "@/components/occupation/occupation-check-panel";
import shell from "@/components/occupation/occupation-shell.module.css";
import { CohortBars } from "@/components/occupation/cohort-bars";
import { OccupationFaq } from "@/components/occupation/occupation-faq";
import { OccupationHowToApply } from "@/components/occupation/occupation-how-to-apply";
import { OccupationSummary } from "@/components/occupation/occupation-summary";
import { OccupationVerdict } from "@/components/occupation/occupation-verdict";
import { PoolTabs } from "@/components/occupation/pool-tabs";
import { RelatedOccupations } from "@/components/occupation/related-occupations";
import { RoundCards } from "@/components/occupation/round-cards";
import { StateTable } from "@/components/occupation/state-table";
import {
  loadManifest,
  loadOccupationCore,
  loadOccupationDetail,
  loadRounds,
} from "@/lib/data/load-server";
import { tieBreakFor } from "@/lib/occupation-page/cutoffs";
import { summarise189Rounds } from "@/lib/report/round-status";
import type { OccupationCore, Visa } from "@/lib/data/types";
import { applyLinks } from "@/lib/guide/apply-links";
import { formatDate } from "@/lib/migration";
import {
  cohortNote,
  cohortRows,
  poolBars,
  poolTotalLabel,
  roundCards,
  roundsNote,
} from "@/lib/occupation-page/charts";
import { droppedNote } from "@/lib/occupation-page/dropped";
import { occupationFaq } from "@/lib/occupation-page/faq";
import {
  isIndexable,
  occupationJsonLd,
  occupationRobots,
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
  listed189,
  occupationSummary,
  sourceLine,
  statusChips,
} from "@/lib/occupation-page/summary";
import { occupationVerdict } from "@/lib/occupation-page/verdict";
import { formatMonth } from "@/lib/report/copy";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { pageMetadata } from "@/lib/seo/page-meta";
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
  const entry = occupationIndex.find((e) => e.code === core.code);
  const rows = stateRows(core.code, core, stateRuleData);
  return pageMetadata({
    path: occupationPath(core),
    title: { absolute: pageTitle(core) },
    description: pageDescription(
      core,
      occupationSummary(core, detail, stateRuleData.federal, rows),
    ),
    type: "article",
    modifiedTime: entry?.lastCheckedAt ?? loadManifest().checkedAt,
    robots: occupationRobots(SITE_INDEXABLE, isIndexable(core)),
  });
}

export default async function OccupationPage({ params }: Props) {
  const core = requireCore((await params).slug);
  const { code, name } = core;
  const detail = loadOccupationDetail(code);
  const manifest = loadManifest();
  const entry = occupationIndex.find((e) => e.code === code);
  const note = entry ? droppedNote(entry) : null;
  // A dropped occupation shows its own last month and the date it was checked.
  const checkedAt = entry?.lastCheckedAt ?? manifest.checkedAt;
  const figuresFrom = note ? formatMonth(core.asAt) : undefined;
  const rows = stateRows(code, core, stateRuleData);
  const sentences = occupationSummary(
    core,
    detail,
    stateRuleData.federal,
    rows,
  );
  const latest = summarise189Rounds(core.rounds189).latestCutoff;
  const faq = occupationFaq(core, rows, {
    federal: stateRuleData.federal,
    tieBreak: latest ? tieBreakFor(loadRounds(), code, latest.date) : null,
  });
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
            <h1 className={styles.title}>{name}</h1>
            <p className={styles.code}>ANZSCO {code}</p>
            <p className={styles.subtitle}>
              189 & 190 permanent visas · 491 provisional visa
            </p>
          </div>
          <dl className={styles.recordDate}>
            <div>
              <dt>Data snapshot</dt>
              <dd>
                <time dateTime={core.asAt}>{formatMonth(core.asAt)}</time>
              </dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>
                <time dateTime={checkedAt}>{formatDate(checkedAt)}</time>
              </dd>
            </div>
          </dl>
        </header>
        {note && <DroppedNote note={note} lastAsAt={core.asAt} />}
        <OccupationSummary
          chips={statusChips(core, stateRuleData.federal)}
          sentences={sentences}
          sourceLine={sourceLine(core)}
        />
        <OccupationVerdict
          name={name}
          verdict={occupationVerdict(core, stateRuleData.federal)}
          figuresFrom={figuresFrom}
        />
        <OccupationHowToApply links={applyLinks(code, stateRuleData.federal)} />
        <OccupationSectionNav
          hasRounds={has189Rounds(core)}
          hasCohorts={Boolean(cohorts)}
        />
        <div className={styles.grid}>
          <aside className={styles.side}>
            <OccupationCheckPanel
              core={core}
              listed189={listed189(code, stateRuleData.federal)}
              figuresFrom={figuresFrom}
            />
          </aside>
          <div className={styles.main}>
            <section aria-labelledby="pool-heading" className={styles.block}>
              <h2 id="pool-heading">How many {name} EOIs are in the pool?</h2>
              <p className={styles.sectionIntro}>
                Submitted <Link href="/guide/glossary/#eoi">EOIs</Link> by
                points score, as at {formatMonth(core.asAt)}. Each visa has its
                own pool; EOIs can appear in more than one. A{" "}
                <Link href="/guide/glossary/#masked-count">“&lt;20”</Link> count
                is 0 to 19, which may be zero.
              </p>
              <PoolTabs pools={pools} totals={totals} />
            </section>
            {has189Rounds(core) && (
              <section
                aria-labelledby="rounds-heading"
                className={styles.block}
              >
                <h2 id="rounds-heading">
                  What were the recent 189 cut-offs for {name}?
                </h2>
                <p className={styles.sectionIntro}>
                  Each round’s{" "}
                  <Link href="/guide/glossary/#cut-off">cut-off</Link>: the
                  lowest points invited for this occupation. “Not listed” is an
                  absent occupation row, not a zero-point cut-off. See{" "}
                  <Link href="/occupations/189-cut-offs/">
                    every occupation’s cut-offs in one table
                  </Link>
                  .
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
                <h2 id="cohort-heading">
                  What happened to recent {name} 189 EOIs?
                </h2>
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
              <p className={styles.sectionLabel}>190 and provisional 491</p>
              <h2 id="states-heading">
                Which states nominate {name} for 190 and 491?
              </h2>
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
              <h2 id="faq-heading">{name}: common questions</h2>
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
          checkedAt={checkedAt}
          sources={manifest.sources}
          snapshotId={core.snapshotId}
          federalCheckedAt={stateRuleData.federal?.checkedAt}
        />
        {occupationJsonLd(
          core,
          faq,
          sentences,
          checkedAt,
          Object.values(manifest.sources),
        ).map((obj, i) => (
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
