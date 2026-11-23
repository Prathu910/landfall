import { BookOpenCheck } from "lucide-react";
import { Faq } from "@/components/faq";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { MethodContents } from "@/components/methodology/method-contents";
import {
  METHOD_DEFINITIONS,
  methodSources,
} from "@/components/methodology/method-content";
import { MethodPrivacy } from "@/components/methodology/method-privacy";
import { occupationIndex } from "@/components/data/occupation-index";
import { MethodSources } from "@/components/methodology/method-sources";
import styles from "@/components/methodology/methodology.module.css";
import { coverageSentence, snapshotCoverage } from "@/lib/data/coverage";
import { loadManifest } from "@/lib/data/load-server";
import { METHOD_LIMITS, METHOD_LINES } from "@/lib/outlook/method";
const manifest = loadManifest();
export const metadata = { title: "Our methodology and sources" };
/** "Strong: your points…" with the label name in ink; the text is unchanged. */
function LabelRule({ line }: { line: string }) {
  const split = line.indexOf(": ");
  if (split < 0) return line;
  return (
    <>
      <strong>{line.slice(0, split)}</strong>
      {line.slice(split)}
    </>
  );
}
export default function MethodologyPage() {
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb="Methodology"
          eyebrow="How MigrateLens works"
          icon={BookOpenCheck}
          title="Methodology and limitations"
          intro="What we use, what we calculate, and where the data stops. Sources checked on 17 November 2026."
        />
        <div className={styles.layout}>
          <MethodContents />
          <div className={styles.content}>
            <MethodSources
              sources={methodSources(manifest.sources.dashboard)}
              coverage={coverageSentence(snapshotCoverage(occupationIndex))}
            />
            <section id="pool" className={styles.section}>
              <h2>How to read the pool</h2>
              <p>
                The homepage explorer shows submitted 189 EOIs. Reports also
                include 190 and state-nominated 491 pools by occupation and
                score, as at 31 October 2026. State pools are national EOI
                totals, not state selection queues. The higher-score count adds
                published rows above the selected score. EOIs sharing that score
                are shown separately.
              </p>
              <p>
                Counts below 20 are published as “&lt;20”. We preserve each as a
                0–19 interval and add the intervals. A displayed range reflects
                source masking, not a statistical confidence interval. Chart
                bars use the upper bound where a value is masked.
              </p>
              <p>
                The chart normally displays scores from 65 to 110. Its range
                expands to include a selected score outside those bounds. Each
                bar represents one score; scores outside the displayed chart
                remain included in the numerical comparisons. Report totals use
                directly published occupation aggregates. Homepage totals sum
                score intervals; they can be wider because suppressed bands
                remain uncertain. Both include all published scores, including
                those below 65. People can submit multiple EOIs, so EOI counts
                are not unique people.
              </p>
              <p>
                Submission month is not sufficient to establish date-of-effect
                tie-break order. We do not describe these comparisons as an
                exact personal queue rank. Twelve monthly 189 occupation totals
                are imported from November 2025 to October 2026. Their net
                change cannot separate invitations, new entries, withdrawals,
                expiries or score changes. Six invitation rounds are matched by
                occupation; missing published rows remain “Not listed”, and are
                not treated as zero invitations.
              </p>
            </section>
            <section id="points" className={styles.section}>
              <h2>How we calculate points and dates</h2>
              <p>
                The calculator applies current federal category values to your
                self-reported answers. Employment points are capped at 20.
                Qualifications count once at the highest applicable level.
                Nomination or sponsorship points are conditional.
              </p>
              <p>
                English is entered as a self-reported level. This release does
                not audit individual test-component scores, delivery modes or
                registration conditions. Qualifying work and study are confirmed
                by your answers; the tool does not assess documents.
              </p>
              <p>
                The timeline shows relevant birthdays and the evidence dates you
                provide. Skills-assessment validity uses the earlier of a stated
                letter expiry and the three-year cap. The EOI window uses
                submission date plus two years. Calendar anniversaries for 29
                February use 28 February in non-leap years; this convention
                needs individual verification for a threshold-sensitive case.
              </p>
              <p>
                Dates beyond three years are omitted. Future employment gains,
                partner-age changes and unconfirmed policy dates are not
                projected in this release. Scenario comparisons recalculate
                hypothetical qualifying credentials or the next employment band,
                while preserving the employment cap. These are not
                recommendations or predictions of future eligibility. No
                completion dates or costs are assumed. There is no guaranteed
                invitation window.
              </p>
            </section>
            <section id="limitations" className={styles.section}>
              <h2>What we can’t tell you</h2>
              {METHOD_LIMITS.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>How the report labels your outlook:</p>
              <ul>
                {METHOD_LINES.map((line) => (
                  <li key={line}>
                    <LabelRule line={line} />
                  </li>
                ))}
              </ul>
              <p>
                State summaries describe published systems. They are not a
                complete personal state-eligibility engine. WA and NT current
                cohort requirements need further verification. Community samples
                and individual invitation probabilities are not used in this
                release.
              </p>
              <p>
                Subclass 491 is provisional; a subsequent permanent-residence
                pathway has its own conditions. For personalised advice, use the{" "}
                <a
                  href="https://www.mara.gov.au/"
                  target="_blank"
                  rel="noreferrer"
                >
                  OMARA register
                </a>{" "}
                to find a registered migration agent.
              </p>
            </section>
            <section id="definitions" className={styles.section}>
              <h2>Useful definitions</h2>
              <dl className={styles.definitions}>
                {METHOD_DEFINITIONS.map(([term, meaning]) => (
                  <div key={term}>
                    <dt>
                      <strong>{term}</strong>
                    </dt>
                    <dd>{meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <MethodPrivacy />
            <section id="questions" className={styles.section}>
              <h2>Common questions</h2>
              <Faq
                items={[
                  [
                    "Is the points check free?",
                    "Yes. This first release has no checkout or subscription. You can calculate your score, view your overview and use the browser print function without paying.",
                  ],
                  [
                    "Is this migration advice?",
                    "It is general information and a self-reported calculation. MigrateLens is not a registered migration agent. A registered agent or Australian legal practitioner can assess your individual circumstances.",
                  ],
                  [
                    "Why do some numbers show a range?",
                    "The official dashboard masks counts below 20. We preserve that uncertainty when adding point bands, rather than filling in invented numbers.",
                  ],
                  [
                    "Does the data update after every round?",
                    "The imported pool is dated 31 October 2026. Invitation results and EOI pool snapshots have separate release schedules. Automatic imports and report refreshes are part of a later release.",
                  ],
                  [
                    "Can I download the report?",
                    "Use Print / save PDF on your overview, then choose your browser’s PDF destination. Automated PDF generation and email delivery are not included in this release.",
                  ],
                  [
                    "What if my occupation is not listed?",
                    `Choose Other occupation for the points check. The report will clearly show that no pool comparison is available. The current imported snapshot covers ${manifest.occupations.length} occupations.`,
                  ],
                ]}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
