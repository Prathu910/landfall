"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Accordion, Button, Checkbox, Progress } from "@mantine/core";
import {
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  CalendarDays,
  FileCheck2,
  LockKeyhole,
  Pencil,
  Printer,
} from "lucide-react";
import {
  calculatePoints,
  buildTimeline,
  formatDate,
  type Profile,
} from "@/lib/migration";
import type { ReportSource } from "@/lib/data/report-source";
import type { OccupationIndexEntry } from "@/lib/data/types";
import type { OccupationEvidence } from "@/lib/report-evidence";
import type { ReportOccupation } from "./data/report-occupation";
import { CompareSection } from "./report/compare-section";
import { PointsAudit } from "./report/points-audit";
import { reportSections, sectionLabel } from "./report/report-sections";
import { reportView } from "./report/report-view";
import { ScenariosSection } from "./report/scenarios-section";
import { RealityScorecard } from "./report/scorecard";
import { StateOutlookSection } from "./report/state-outlook-section";
import { VisaPanels } from "./report/visa-panels";
const preparations = [
  "Identity and passport details",
  "Skills assessment and validity dates",
  "English evidence and validity dates",
  "Qualifications and study records",
  "Employment dates and supporting records",
  "Partner evidence, if applicable",
  "EOI details and date of effect",
  "Visa conditions and expiry dates",
];
const definitions = [
  [
    "EOI",
    "An Expression of Interest records interest in a skilled visa through SkillSelect. It is not a visa application.",
  ],
  [
    "Date of effect",
    "The date and time associated with an EOI’s points score for ranking purposes. It may change when the score changes. It is not necessarily the original submission date.",
  ],
  [
    "Pool snapshot",
    "A dated picture of published EOI counts. It is not a live queue and may include multiple EOIs from the same person.",
  ],
  [
    "Invitation cutoff",
    "The lowest score published for an occupation in a particular invitation round. It does not establish a future cutoff or your invitation prospects.",
  ],
  [
    "State nomination",
    "A separate selection process conducted by a state or territory. Federal points alone do not establish nomination eligibility.",
  ],
  [
    "491 and permanent residence",
    "Subclass 491 is a provisional regional visa. A later permanent residence pathway, such as subclass 191, has separate requirements.",
  ],
];
export function Report({
  profile,
  asOf,
  sample = false,
  onEdit,
  onAnswer,
  occupation,
  comparisonIndex,
  initialComparison,
  source,
}: {
  profile: Profile;
  asOf: string;
  sample?: boolean;
  onEdit?: () => void;
  /** Merges a "Sharpen my state outlook" answer into the profile; absent on the sample. */
  onAnswer?: (patch: Partial<Profile>) => void;
  occupation: ReportOccupation;
  /** Must keep a stable identity: the comparison loader's effect depends on it. */
  comparisonIndex: OccupationIndexEntry[];
  /** Server-rendered evidence for the default comparison occupation. */
  initialComparison?: OccupationEvidence;
  source: ReportSource;
}) {
  const result = calculatePoints(profile, asOf);
  const events = buildTimeline(profile, asOf);
  const nominated = comparisonIndex.find((o) => o.code === profile.occupation);
  const view = reportView({
    profile,
    asOf,
    occupation,
    index: comparisonIndex,
  });
  const sections = reportSections(view.panels !== null);
  const [checks, setChecks] = useState<string[]>([]);
  const [active, setActive] = useState("reality-check");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    sections.forEach(([id]) => {
      const e = document.getElementById(id);
      if (e) observer.observe(e);
    });
    return () => observer.disconnect();
  }, [sections]);
  return (
    <>
      <div className="report-toolbar">
        <span className="subtle">
          {sample
            ? "Fictional profile. Real published data."
            : "Your personal overview, built from your answers."}
        </span>
        <div className="page-actions">
          {onEdit && (
            <Button
              variant="default"
              size="sm"
              leftSection={<Pencil size={13} />}
              onClick={onEdit}
            >
              Edit answers
            </Button>
          )}
          <Button
            size="sm"
            color="ink.9"
            leftSection={<Printer size={14} />}
            onClick={() => window.print()}
          >
            Print / save PDF
          </Button>
        </div>
      </div>
      <div className="report-layout">
        <nav className="report-nav" aria-label="Report sections">
          <span>YOUR PERSPECTIVE</span>
          {sections.map(([id, title], i) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "true" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {title}
            </a>
          ))}
          <small>
            <LockKeyhole size={12} /> Calculated in your browser
          </small>
        </nav>
        <article className="report-sheet">
          <header className="report-heading">
            <div className="report-heading-top">
              <span className="eyebrow">THE MIGRATELENS PERSPECTIVE</span>
              <span className="pill">
                {sample ? "Sample report" : "Your free overview"}
              </span>
            </div>
            <h1>
              {profile.name ? `${profile.name}, here’s` : "Here’s"}
              <br />
              <em>your migration picture.</em>
            </h1>
            <p>
              {nominated?.name ?? "Your nominated occupation"}
              {nominated ? ` · ${nominated.code}` : ""}
              <br />
              189 independent · 190 nominated · 491 regional
            </p>
            <div className="report-heading-meta">
              <CalendarDays size={12} /> Calculated {formatDate(asOf)}{" "}
              <span>·</span> Pool snapshot {formatDate(source.snapshotDate)}
            </div>
          </header>
          <div className="report-body">
            <RealityScorecard scorecard={view.scorecard} />
            <VisaPanels
              occupation={occupation}
              panels={view.panels}
              source={view.scorecard.sourceLine}
            />
            {view.stateOutlook && (
              <StateOutlookSection
                view={view.stateOutlook}
                profile={profile}
                onAnswer={onAnswer}
              />
            )}
            <PointsAudit
              result={result}
              label={sectionLabel(sections, "points", "YOUR POINTS AUDIT")}
            />
            <ScenariosSection
              profile={profile}
              asOf={asOf}
              label={sectionLabel(
                sections,
                "scenarios",
                "EXPLORE THE WHAT-IFS",
              )}
            />
            <section className="report-section" id="timeline">
              <span className="section-label">
                {sectionLabel(sections, "timeline", "YOUR PERSONAL DATES")}
              </span>
              <h2>
                The next chapter,
                <br />
                <em>on your timeline.</em>
              </h2>
              <p>
                Dated events supported by your answers in the next three years.
                Future points assume today’s rules.
              </p>
              {events.length ? (
                <div className="report-timeline">
                  {events.map((e, i) => (
                    <div
                      key={`${e.date}-${i}`}
                      className={`report-event ${e.kind}`}
                    >
                      <time dateTime={e.date}>{formatDate(e.date)}</time>
                      <i />
                      <div>
                        <h3>
                          {e.title}
                          {e.delta ? (
                            <span className="pill">
                              {e.delta > 0 ? "+" : ""}
                              {e.delta} points
                            </span>
                          ) : null}
                        </h3>
                        <p>{e.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="report-empty">
                  <CalendarDays size={18} />
                  <p>
                    Add test, assessment, EOI or visa dates to bring more of
                    your timeline into view.
                  </p>
                </div>
              )}
              <Accordion
                keepMounted
                keepMountedMode="display-none"
                className="report-accordion"
                variant="default"
              >
                <Accordion.Item value="policy">
                  <Accordion.Control>
                    What about announced points-test reforms?
                  </Accordion.Control>
                  <Accordion.Panel>
                    Reform has been announced, but this report does not apply
                    unconfirmed new point values or an assumed commencement
                    date. The timeline uses current rules.{" "}
                    <a
                      className="source-link"
                      href="https://minister.homeaffairs.gov.au/TonyBurke/Pages/speech-national-press-club-17092026.aspx"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Official announcement
                    </a>
                    . Source checked 17 November 2026.
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </section>
            <CompareSection
              occupation={occupation}
              occupationCode={profile.occupation}
              index={comparisonIndex}
              initialComparison={initialComparison}
              score={result.base}
              snapshotDate={source.snapshotDate}
              label={sectionLabel(sections, "compare", "OCCUPATION CONTEXT")}
            />
            <section className="report-section" id="prepare">
              <span className="section-label">
                {sectionLabel(sections, "prepare", "GET ORGANISED")}
              </span>
              <h2>
                Bring the evidence <em>together.</em>
              </h2>
              <p>
                A general preparation list to help organise your records. Tick
                items as you review them. It is not an exhaustive application
                checklist or an assessment of your documents.
              </p>
              <div className="report-checklist-meta">
                <span>
                  {checks.length} of {preparations.length} reviewed
                </span>
                <span>Session only · no documents uploaded</span>
              </div>
              <Progress
                className="report-progress"
                value={(checks.length / preparations.length) * 100}
                size="sm"
                aria-label="Evidence review progress"
              />
              <div className="checklist-grid">
                {preparations.map((item) => (
                  <div className="checklist-item" key={item}>
                    <Checkbox
                      label={item}
                      checked={checks.includes(item)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setChecks((items) =>
                          checked
                            ? [...items, item]
                            : items.filter((i) => i !== item),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="planning-links">
                <a
                  href="https://immi.homeaffairs.gov.au/visas/visa-pricing-estimator"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official visa pricing estimator <ArrowUpRight size={13} />
                </a>
                <a
                  href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times/global-visa-processing-times"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official processing times <ArrowUpRight size={13} />
                </a>
              </div>
              <p className="data-caption">
                Fees vary by applicant and family circumstances and may change.
                Processing times start at the visa application stage; they are
                not an EOI invitation waiting time.
              </p>
            </section>
            <section className="report-section" id="definitions">
              <span className="section-label">
                {sectionLabel(sections, "definitions", "USEFUL DEFINITIONS")}
              </span>
              <h2>
                The terms, <em>made clearer.</em>
              </h2>
              <Accordion
                keepMounted
                keepMountedMode="display-none"
                variant="default"
                className="report-accordion"
              >
                {definitions.map(([title, description]) => (
                  <Accordion.Item value={title} key={title}>
                    <Accordion.Control>{title}</Accordion.Control>
                    <Accordion.Panel>{description}</Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </section>
            {result.warnings.length > 0 && (
              <section className="report-section">
                <span className="section-label">ASSUMPTIONS TO REVIEW</span>
                <h2>
                  What’s behind <em>your picture.</em>
                </h2>
                <ul className="warning-list">
                  {result.warnings.map((w) => (
                    <li key={w}>
                      <AlertCircle size={14} />
                      {w}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section className="report-section">
              <Accordion
                keepMounted
                keepMountedMode="display-none"
                variant="default"
                className="report-accordion"
              >
                <Accordion.Item value="boundaries">
                  <Accordion.Control>
                    <span className="inline-icon">
                      <FileCheck2 size={16} /> What this report can and cannot
                      tell you
                    </span>
                  </Accordion.Control>
                  <Accordion.Panel>
                    Included: a reality check across 189, 190 and 491, a
                    self-reported points audit, hypothetical credential
                    scenarios, three dated occupation pools, twelve monthly 189
                    totals, published invitation rounds, published outcomes of
                    EOIs by submission month, personal dates, a state outlook
                    from each state’s published 2026–27 rules and invitations,
                    and preparation tools. Exact queue rank, invitation dates,
                    personal probabilities, state nomination decisions,
                    state-run scores (such as Victoria’s points test or the
                    Canberra Matrix), current ceiling utilisation and gross EOI
                    movements are unavailable here. These need additional
                    verified data or a defensible model. Payment, automated
                    report delivery and ongoing monitoring are future product
                    work.
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            </section>
            <footer className="report-source-footer">
              <p>
                Pool and monthly history:{" "}
                <a
                  className="source-link"
                  href={source.dashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Home Affairs SkillSelect dashboard
                </a>
                . Submitted EOIs; current snapshot{" "}
                {formatDate(source.snapshotDate)}; sources checked{" "}
                {formatDate(source.checkedAt)}. Monthly history uses directly
                published occupation totals. Score comparisons sum published
                score-band intervals. Counts below 20 remain masked. State 491
                excludes family sponsorship. 189 invitation rounds:{" "}
                <a
                  className="source-link"
                  href={source.roundsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  current results
                </a>{" "}
                and{" "}
                <a
                  className="source-link"
                  href={source.previousRoundsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  previous rounds
                </a>
                .
              </p>
              <p>
                Rule set federal-current-2026-11 · Report v0.2. General
                information, not migration advice. MigrateLens is independent
                and is not a registered migration agent. Government material
                attributed under its published licensing terms.{" "}
                <Link className="source-link" href="/methodology/">
                  Methodology & limitations
                </Link>
                .
              </p>
            </footer>
          </div>
        </article>
      </div>
      {sample && (
        <div className="final-cta no-print">
          <div className="container">
            <span className="eyebrow">MAKE THE PICTURE YOUR OWN</span>
            <h2>
              Now, <em>your numbers.</em>
            </h2>
            <p>The free check builds this overview from your own answers.</p>
            <Link className="button button-accent" href="/check/">
              Start my free check <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
