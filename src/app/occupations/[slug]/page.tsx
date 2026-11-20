import type { Metadata } from "next";
import Link from "next/link";
import { occupationIndex } from "@/components/data/occupation-index";
import { stateRuleData } from "@/components/data/state-rule-data";
import { TryIt } from "@/components/home/try-it";
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
    <main id="main" className="container">
      <nav className={styles.crumb} aria-label="Breadcrumb">
        <Link href="/occupations/">Occupations</Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page">{name}</span>
      </nav>
      <h1 className={styles.title}>
        {name} ({code})
      </h1>
      <p className={styles.subtitle}>
        Australian skilled visas: 189, 190 and 491 EOIs, cut-offs and
        invitations · as at {formatMonth(core.asAt)}
      </p>
      <OccupationSummary
        chips={statusChips(core, stateRuleData.federal)}
        sentences={sentences}
        sourceLine={sourceLine(core)}
      />
      <div className={styles.grid}>
        <div className={styles.main}>
          <section aria-labelledby="pool-heading" className={styles.block}>
            <h2 id="pool-heading">EOIs waiting, by points</h2>
            <PoolTabs pools={pools} totals={totals} />
          </section>
          {has189Rounds(core) && (
            <section aria-labelledby="rounds-heading" className={styles.block}>
              <h2 id="rounds-heading">Recent 189 rounds</h2>
              <RoundCards
                cards={roundCards(core.rounds189)}
                note={roundsNote(core.rounds189)}
              />
            </section>
          )}
          {cohorts && (
            <section aria-labelledby="cohort-heading" className={styles.block}>
              <h2 id="cohort-heading">Where recent 189 EOIs stand now</h2>
              <CohortBars rows={cohorts} note={cohortNote(name, cohorts)} />
            </section>
          )}
          <section aria-labelledby="states-heading" className={styles.block}>
            <h2 id="states-heading">State nomination</h2>
            <StateTable rows={rows} invitedHeading={invitedHeading(core)} />
          </section>
          <section aria-labelledby="faq-heading" className={styles.block}>
            <h2 id="faq-heading">Common questions</h2>
            <OccupationFaq items={faq} />
          </section>
          <RelatedOccupations
            items={relatedOccupations(code, occupationIndex)}
            unitGroup={code.slice(0, 4)}
          />
        </div>
        <aside className={styles.side}>
          <TryIt defaultOccupation={code} currentCode={code} />
          <Link href={`/check/?occupation=${code}`} className={styles.cta}>
            Check my points, free
          </Link>
        </aside>
      </div>
      <p className={styles.sources}>
        {sourceLine(core)}. Last updated {formatDate(manifest.checkedAt)}.
        General information, not migration advice. MigrateLens is not a
        registered migration agent.
      </p>
      {occupationJsonLd(core, faq, sentences, manifest.checkedAt).map(
        (obj, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(obj) }}
          />
        ),
      )}
    </main>
  );
}
