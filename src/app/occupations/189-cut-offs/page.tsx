import type { Metadata } from "next";
import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { occupationIndex } from "@/components/data/occupation-index";
import page from "@/components/guide/guide-page.module.css";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { CutoffTable } from "@/components/occupation/cutoff-table";
import { JsonLd } from "@/components/seo/json-ld";
import { loadManifest, loadRounds } from "@/lib/data/load-server";
import { formatDate } from "@/lib/migration";
import {
  CUTOFFS_PAGE as PAGE,
  cutoffTable,
  cutoffsAnswer,
  cutoffsJsonLd,
} from "@/lib/occupation-page/cutoffs";
import { occupationPath } from "@/lib/occupation-page/slug";
import { pageMetadata } from "@/lib/seo/page-meta";
import { loadLatestRound } from "@/lib/updates/load-server";

const PAGES = occupationIndex
  .filter((e) => e.hasData)
  .map((e) => ({ code: e.code, name: e.name, path: occupationPath(e) }));

export const metadata: Metadata = pageMetadata({
  path: PAGE.path,
  title: PAGE.title,
  description: PAGE.description,
});

export default function CutoffsPage() {
  const rounds = loadRounds();
  const table = cutoffTable(rounds, PAGES);
  const answer = cutoffsAnswer(rounds, table);
  const { sources } = loadManifest();
  const latest = loadLatestRound();
  const newest = table.rounds[0];
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb={PAGE.crumb}
          trail={[{ href: "/occupations/", label: "Occupations" }]}
          eyebrow="SkillSelect invitation rounds"
          icon={ListOrdered}
          title={PAGE.heading}
          intro="The lowest points score Home Affairs invited for each occupation in the last four 189 rounds, from the published round results."
          meta={[
            <>
              Latest round <time dateTime={newest}>{formatDate(newest)}</time>
            </>,
            `${table.rows.length} occupations listed in at least one round`,
          ]}
        />
        <section className={page.answer} aria-labelledby="answer-heading">
          <h2 id="answer-heading" className={page.answerHeading}>
            The short answer
          </h2>
          <p className={page.answerText}>{answer}</p>
          <p className={page.caveat}>
            Past cut-offs are history, not a promise. Each occupation’s page has
            its EOI pool by points; the{" "}
            <Link href="/guide/189/">189 guide</Link> explains how rounds work
            {latest && (
              <>
                , and the{" "}
                <Link href={`/updates/${latest.month}/`}>monthly update</Link>{" "}
                covers the latest round
              </>
            )}
            .
          </p>
        </section>
        <section
          id="cut-offs"
          className={page.section}
          aria-labelledby="cut-offs-h"
        >
          <h2 id="cut-offs-h">What was the 189 cut-off for each occupation?</h2>
          <p className={page.sectionIntro}>
            Newest round first. A cut-off is the lowest score invited in that
            round; “Not listed” means the round didn’t include the occupation,
            not a cut-off of zero. The tie-break date is the one published with
            the newest listed cut-off: at that score, EOIs are ordered by their
            date of effect.
          </p>
          <CutoffTable table={table} />
        </section>
      </div>
      <JsonLd
        data={cutoffsJsonLd(answer, table, [
          sources.currentRounds,
          sources.previousRounds,
        ])}
      />
    </main>
  );
}
