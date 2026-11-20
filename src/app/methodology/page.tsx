import { PrivacyContact } from "@/components/submissions/privacy-contact";
import { ArrowUpRight } from "lucide-react";
import { Faq } from "@/components/faq";
import { loadManifest } from "@/lib/data/load-server";
const manifest = loadManifest();
export const metadata = { title: "Our methodology and sources" };
const sources = [
  {
    name: "SkillSelect EOI dashboard",
    description:
      "31 October 2026 · 189, 190 and state 491 submitted pools · twelve monthly 189 occupation totals",
    url: manifest.sources.dashboard,
  },
  {
    name: "Federal points table",
    description: "Current category values and qualifying conditions",
    url: "https://immi.homeaffairs.gov.au/supporting/Pages/Work/190-points-table.aspx",
  },
  {
    name: "SkillSelect invitation rounds",
    description: "Published round results and invitation process",
    url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/invitation-rounds",
  },
  {
    name: "Skills assessment guidance",
    description: "Validity periods, the three-year cap and exceptions",
    url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment",
  },
  {
    name: "English evidence",
    description: "Accepted tests, score thresholds and date-dependent rules",
    url: "https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language",
  },
  {
    name: "EOI validity",
    description: "Two-year active period and keeping details up to date",
    url: "https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/expression-of-interest/after-you-submit-your-expression-of-interest",
  },
  {
    name: "Home Affairs licensing",
    description: "Attribution and exclusions for government material",
    url: "https://www.homeaffairs.gov.au/access-and-accountability/using-our-website/copyright-and-disclaimer",
  },
];
export default function MethodologyPage() {
  return (
    <main id="main" className="container">
      <div className="page-head">
        <h1>Methodology and limitations</h1>
        <p>
          What we use, what we calculate, and where the data stops. Sources
          checked on 17 November 2026.
        </p>
      </div>
      <div className="method-layout">
        <nav className="method-nav" aria-label="On this page">
          <a href="#sources">Our sources</a>
          <a href="#pool">Reading the pool</a>
          <a href="#points">Points & dates</a>
          <a href="#limitations">Limitations</a>
          <a href="#privacy">Your privacy</a>
          <a href="#questions">Common questions</a>
        </nav>
        <div className="method-content">
          <section id="sources">
            <h2>Our sources</h2>
            <p>
              We use public government information and keep the data date
              visible. The current occupation import covers 11 occupations; it
              is a checked-in snapshot, not a live connection to SkillSelect.
            </p>
            {sources.map((s) => (
              <div className="source-item" key={s.name}>
                <div>
                  {s.name}
                  <small>{s.description}</small>
                </div>
                <a href={s.url} target="_blank" rel="noreferrer">
                  Source
                  <ArrowUpRight size={13} />
                </a>
              </div>
            ))}
          </section>
          <section id="pool">
            <h2>How to read the pool</h2>
            <p>
              The homepage explorer shows submitted 189 EOIs. Reports also
              include 190 and state-nominated 491 pools by occupation and score,
              as at 31 October 2026. State pools are national EOI totals, not
              state selection queues. The higher-score count adds published rows
              above the selected score. EOIs sharing that score are shown
              separately.
            </p>
            <p>
              Counts below 20 are published as “&lt;20”. We preserve each as a
              0–19 interval and add the intervals. A displayed range reflects
              source masking, not a statistical confidence interval. Chart bars
              use the upper bound where a value is masked.
            </p>
            <p>
              The chart normally displays scores from 65 to 110. Its range
              expands to include a selected score outside those bounds. Each bar
              represents one score; scores outside the displayed chart remain
              included in the numerical comparisons. Report totals use directly
              published occupation aggregates. Homepage totals sum score
              intervals; they can be wider because suppressed bands remain
              uncertain. Both include all published scores, including those
              below 65. People can submit multiple EOIs, so EOI counts are not
              unique people.
            </p>
            <p>
              Submission month is not sufficient to establish date-of-effect
              tie-break order. We do not describe these comparisons as an exact
              personal queue rank. Twelve monthly 189 occupation totals are
              imported from November 2025 to October 2026. Their net change
              cannot separate invitations, new entries, withdrawals, expiries or
              score changes. Six invitation rounds are matched by occupation;
              missing published rows remain “Not listed”, and are not treated as
              zero invitations.
            </p>
          </section>
          <section id="points">
            <h2>How we calculate points and dates</h2>
            <p>
              The calculator applies current federal category values to your
              self-reported answers. Employment points are capped at 20.
              Qualifications count once at the highest applicable level.
              Nomination or sponsorship points are conditional.
            </p>
            <p>
              English is entered as a self-reported level. This release does not
              audit individual test-component scores, delivery modes or
              registration conditions. Qualifying work and study are confirmed
              by your answers; the tool does not assess documents.
            </p>
            <p>
              The timeline shows relevant birthdays and the evidence dates you
              provide. Skills-assessment validity uses the earlier of a stated
              letter expiry and the three-year cap. The EOI window uses
              submission date plus two years. Calendar anniversaries for 29
              February use 28 February in non-leap years; this convention needs
              individual verification for a threshold-sensitive case.
            </p>
            <p>
              Dates beyond three years are omitted. Future employment gains,
              partner-age changes and unconfirmed policy dates are not projected
              in this release. Scenario comparisons recalculate hypothetical
              qualifying credentials or the next employment band, while
              preserving the employment cap. These are not recommendations or
              predictions of future eligibility. No completion dates or costs
              are assumed. There is no guaranteed invitation window.
            </p>
          </section>
          <section id="limitations">
            <h2>What we can’t tell you</h2>
            <p>
              This overview does not establish full visa eligibility, advise
              which visa to apply for, or predict an invitation. Age, English
              and assessment checks cover only a subset of the requirements, and
              exceptions can apply.
            </p>
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
                className="source-link"
                href="https://www.mara.gov.au/"
                target="_blank"
                rel="noreferrer"
              >
                OMARA register
              </a>{" "}
              to find a registered migration agent.
            </p>
          </section>
          <section id="privacy">
            <h2>Your information and privacy</h2>
            <p>
              Your full profile and points calculation stay in your browser. To
              view your personal report, you submit an email and a limited
              calculation summary: occupation, age band, whether you are in
              Australia, points totals, and the SkillSelect snapshot used. We
              store these with a submission date to understand usage. Your name,
              birth date, credential dates, visa expiry, documents and full
              answers are not sent with that submission. The public sample
              report does not require email.
            </p>
            <p>
              We use Supabase to process and store submissions, and Cloudflare
              Turnstile to reduce spam. Entering an email does not verify its
              ownership, create an account, subscribe you to updates or
              marketing, or send an emailed report.
            </p>
            <p>
              Feedback stores your message and category, plus an email and
              calculation summary only if you choose to include them. Please do
              not include documents or sensitive identifiers. We may use an
              optional feedback email to respond to that message.
            </p>
            <p>
              We delete submitted calculations and feedback 180 days after they
              are submitted. Deletion from backup copies follows the hosting
              provider’s backup retention. Access is restricted to the site
              operator and the services that process submissions. Hosting and
              security services may also process connection information and keep
              ordinary access logs. We use Cloudflare Web Analytics, which
              counts page visits without cookies and without identifying you.
            </p>
            <p>
              Your full answers are held in memory unless you enable “Save my
              progress on this device”. That option uses browser local storage
              and excludes your report email. Anyone using the same browser may
              see locally saved answers. “Clear my answers” removes the browser
              copy. An optional feedback-summary handoff uses session storage
              for up to 15 minutes and is removed when the feedback page reads
              it.
            </p>
            <PrivacyContact />
            <p>
              Printing or saving your report creates a copy under your control.
              External source links have their own privacy policies. Collection
              notice version: 20 November 2026.
            </p>
          </section>
          <section className="faq" id="questions">
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
    </main>
  );
}
