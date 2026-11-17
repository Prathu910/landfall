"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Accordion,
  Button,
  Checkbox,
  NumberInput,
  Progress,
  SegmentedControl,
  Select,
} from "@mantine/core";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  Info,
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
import {
  snapshot,
  comparePool,
  formatInterval,
  normalizePoolScore,
} from "@/lib/pool";
import {
  evidence,
  getOccupationEvidence,
  netPoolChange,
  type TrendEvidence,
  type VisaPathway,
} from "@/lib/report-evidence";
import { buildScenarios, applyScenarios } from "@/lib/scenarios";
import { statePrograms } from "@/data/states";
import { PoolChart } from "./pool-explorer";
import { AnimatedNumber } from "./reveal";

const sections = [
  ["points", "Your points"],
  ["scenarios", "What could change"],
  ["pool", "The published pool"],
  ["rounds", "Invitation history"],
  ["timeline", "Your personal dates"],
  ["states", "State pathways"],
  ["compare", "Occupation context"],
  ["prepare", "Get organised"],
  ["definitions", "Useful definitions"],
];
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
function TrendChart({ rows }: { rows: TrendEvidence[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const reduced = useReducedMotion();
  if (!rows.length) return null;
  const min = Math.min(...rows.map((r) => r.total.min)) * 0.94,
    max = Math.max(...rows.map((r) => r.total.max)) * 1.03,
    span = Math.max(1, max - min);
  const x = (i: number) => 20 + (i / (rows.length - 1 || 1)) * 560,
    y = (n: number) => 145 - ((n - min) / span) * 115;
  const path = rows
      .map((r, i) => `${i ? "L" : "M"}${x(i)},${y(r.total.max)}`)
      .join(" "),
    active = rows[selected ?? rows.length - 1];
  return (
    <div className="trend-chart">
      <svg
        viewBox="0 0 600 178"
        role="img"
        aria-label="Twelve monthly published 189 submitted EOI totals. Relative vertical scale; masked totals use an upper-bound line."
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6dba88" stopOpacity=".22" />
            <stop offset="100%" stopColor="#6dba88" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 85, 140].map((n) => (
          <line
            key={n}
            x1="20"
            x2="580"
            y1={n}
            y2={n}
            stroke="#e3ecde"
            strokeDasharray="3 5"
          />
        ))}
        <path d={`${path} L580,145 L20,145 Z`} fill="url(#trend-fill)" />
        <motion.path
          d={path}
          fill="none"
          stroke="#438d5c"
          strokeWidth="2.5"
          initial={false}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduced ? 0 : 0.8 }}
        />
        {rows.map((r, i) => (
          <g
            key={r.date}
            onMouseEnter={() => setSelected(i)}
            onMouseLeave={() => setSelected(null)}
          >
            <title>{`${formatDate(r.date)}: ${formatInterval(r.total)} EOIs`}</title>
            <circle cx={x(i)} cy={y(r.total.max)} r="16" fill="transparent" />
            <circle
              cx={x(i)}
              cy={y(r.total.max)}
              r={selected === i ? 5 : 3}
              fill={selected === i ? "#102e29" : "#fff"}
              stroke="#438d5c"
              strokeWidth="2"
            />
            {(i === 0 || i === rows.length - 1 || i % 3 === 0) && (
              <text
                x={x(i)}
                y="170"
                textAnchor={
                  i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle"
                }
                fill="#5d7e63"
                fontSize="10"
              >
                {new Date(r.date + "T00:00:00Z").toLocaleDateString("en-GB", {
                  month: "short",
                  year: "2-digit",
                  timeZone: "UTC",
                })}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="trend-detail" aria-live="polite">
        <span>
          {formatDate(active.date)} ·{" "}
          <strong>{formatInterval(active.total)} EOIs</strong>
        </span>
        <span>189 submitted · relative scale</span>
      </div>
      <Accordion
        keepMounted
        keepMountedMode="display-none"
        className="report-accordion"
        variant="default"
      >
        <Accordion.Item value="table">
          <Accordion.Control>View monthly figures</Accordion.Control>
          <Accordion.Panel>
            <table className="rounds-table">
              <thead>
                <tr>
                  <th scope="col">Snapshot</th>
                  <th scope="col">Submitted EOIs</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date}>
                    <td>{formatDate(r.date)}</td>
                    <td>{formatInterval(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

export function Report({
  profile,
  asOf,
  sample = false,
  onEdit,
}: {
  profile: Profile;
  asOf: string;
  sample?: boolean;
  onEdit?: () => void;
}) {
  const result = calculatePoints(profile, asOf),
    events = buildTimeline(profile, asOf),
    occupation = snapshot.occupations.find(
      (o) => o.code === profile.occupation,
    ),
    data = getOccupationEvidence(profile.occupation);
  const [visa, setVisa] = useState<VisaPathway>("189"),
    [scoreOverride, setScoreOverride] = useState<number | null>(null),
    [scenarios, setScenarios] = useState<string[]>([]),
    [checks, setChecks] = useState<string[]>([]),
    [comparison, setComparison] = useState("261313"),
    [active, setActive] = useState("points");
  const assumed = calculatePoints(
      applyScenarios(profile, scenarios, asOf),
      asOf,
    ),
    options = buildScenarios(profile, asOf),
    change = assumed.base - result.base;
  const score =
    scoreOverride ??
    (visa === "190"
      ? result.subclass190
      : visa === "491"
        ? result.subclass491
        : result.base);
  const pathway = data?.pathways.find((p) => p.visa === visa),
    pool = pathway ? comparePool(pathway, score) : null;
  const compared = getOccupationEvidence(comparison),
    otherPool = compared?.pathways.find((p) => p.visa === "189");
  const trendChange = data?.trend.length
    ? netPoolChange(
        data.trend[0].total,
        data.trend[data.trend.length - 1].total,
      )
    : null;
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
  }, []);
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
            color="forest.9"
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
              <span className="eyebrow">
                THE LANDFALL MIGRATION PERSPECTIVE
              </span>
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
              {occupation?.name ?? "Your nominated occupation"}
              {occupation ? ` · ${occupation.code}` : ""}
              <br />
              189 independent · 190 nominated · 491 regional
            </p>
            <div className="report-heading-meta">
              <CalendarDays size={12} /> Calculated {formatDate(asOf)}{" "}
              <span>·</span> Pool snapshot {formatDate(evidence.snapshotDate)}
            </div>
          </header>
          <div className="report-body">
            <div className="score-cards">
              {[
                {
                  title: "189 · Independent",
                  score: result.base,
                  detail: result.missing.length
                    ? "Partial score · answers incomplete"
                    : "Self-reported federal points",
                },
                {
                  title: "190 · Nominated",
                  score: result.subclass190,
                  detail: "Includes 5 points only if nominated",
                },
                {
                  title: "491 · Regional",
                  score: result.subclass491,
                  detail: "Includes 15 only if nominated or sponsored",
                },
              ].map((c) => (
                <div className="score-card" key={c.title}>
                  <span>{c.title}</span>
                  <strong>
                    <AnimatedNumber value={c.score} />
                  </strong>
                  <p>{c.detail}</p>
                </div>
              ))}
            </div>
            <p className="report-intro">
              A connected view of your points, published occupation data and
              personal dates. Your answers set the context; official sources
              provide the evidence.
            </p>
            <div
              className={`notice ${result.eligible === false ? "warning" : ""}`}
            >
              {result.eligible === true ? (
                <CheckCircle2 size={17} />
              ) : (
                <Info size={17} />
              )}
              <p>
                <strong>
                  {result.eligible === false
                    ? "Some basic checks need attention."
                    : result.eligible === null
                      ? "Some evidence still needs checking."
                      : "Age, English and assessment checks show no issue."}
                </strong>{" "}
                These checks cover only part of the visa requirements.{" "}
                {result.base < 65
                  ? "The 189 estimate is below the current 65-point threshold."
                  : "Meeting 65 points does not guarantee an invitation."}{" "}
                <a
                  className="source-link"
                  href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/expression-of-interest"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official requirements
                </a>
              </p>
            </div>
            <section className="report-section" id="points">
              <span className="section-label">01 / YOUR POINTS AUDIT</span>
              <h2>
                Every point, <em>accounted for.</em>
              </h2>
              <p>
                Your current self-reported score, separated into the categories
                behind it.
              </p>
              {result.categories.map((c) => (
                <div className="audit-row" key={c.key}>
                  <span>{c.label}</span>
                  <div className="audit-bar" aria-hidden="true">
                    <motion.span
                      initial={false}
                      animate={{ width: `${(c.points / c.max) * 100}%` }}
                    />
                  </div>
                  <span>
                    {c.points}
                    <span className="subtle"> / {c.max}</span>
                  </span>
                </div>
              ))}
              <p className="data-caption">
                Employment points are combined and capped at 20. Highest
                qualification points count once.{" "}
                <a
                  className="source-link"
                  href="https://immi.homeaffairs.gov.au/supporting/Pages/Work/190-points-table.aspx"
                  target="_blank"
                  rel="noreferrer"
                >
                  Official points table <ArrowUpRight size={11} />
                </a>
              </p>
            </section>
            <section className="report-section" id="scenarios">
              <span className="section-label">02 / EXPLORE THE WHAT-IFS</span>
              <h2>
                One change.
                <br />
                <em>A different picture.</em>
              </h2>
              <p>
                Compare hypothetical qualifying changes together. We recalculate
                your score, including the employment cap. This does not assess
                whether a credential or work period qualifies.
              </p>
              <div className="scenario-grid">
                {options.map((s) => (
                  <div
                    className="scenario-card"
                    key={s.id}
                    data-selected={scenarios.includes(s.id)}
                  >
                    <Checkbox
                      label={s.title}
                      checked={scenarios.includes(s.id)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setScenarios((ids) =>
                          checked
                            ? [...ids, s.id]
                            : ids.filter((id) => id !== s.id),
                        );
                      }}
                    />
                    <p>{s.description}</p>
                  </div>
                ))}
              </div>
              <div className="scenario-result" aria-live="polite">
                <div>
                  <span>Hypothetical federal points</span>
                  <strong>
                    <AnimatedNumber value={assumed.base} />
                  </strong>{" "}
                  <span className="pill">
                    {change > 0 ? "+" : ""}
                    {change} points
                  </span>
                </div>
                <div>
                  Current {result.base} → Scenario {assumed.base}
                  <br />
                  {assumed.subclass190} if 190 nominated
                  <br />
                  {assumed.subclass491} if 491 nominated / sponsored
                </div>
              </div>
              <Button
                component="a"
                href="#pool"
                variant="light"
                size="xs"
                mt="md"
                rightSection={<ArrowRight size={13} />}
                onClick={() => {
                  setVisa("189");
                  setScoreOverride(assumed.base);
                }}
              >
                Compare this scenario in the pool
              </Button>
              <p className="data-caption">
                No future completion date, cost, invitation or evidence approval
                is assumed. Pool comparisons below remain based on your current
                score unless you change them.
              </p>
            </section>
            <section className="report-section" id="pool">
              <span className="section-label">
                03 / THE PUBLISHED OCCUPATION POOL
              </span>
              <h2>
                See the numbers.
                <br />
                <em>Keep the context.</em>
              </h2>
              {occupation && data && pathway && pool ? (
                <>
                  <p>
                    Compare your score with the same dated snapshot. The 190 and
                    491 views describe national nomination EOI pools; they are
                    not state selection rankings.
                  </p>
                  <div className="pool-controls">
                    <SegmentedControl
                      aria-label="Visa pool"
                      value={visa}
                      onChange={(v) => {
                        setVisa(v as VisaPathway);
                        setScoreOverride(null);
                      }}
                      data={[
                        { value: "189", label: "189 Independent" },
                        { value: "190", label: "190 Nominated" },
                        { value: "491", label: "491 State regional" },
                      ]}
                    />
                    <NumberInput
                      label="Comparison score"
                      aria-label="Pool comparison score"
                      min={0}
                      max={150}
                      step={5}
                      allowDecimal={false}
                      clampBehavior="strict"
                      value={score}
                      onChange={(v) =>
                        setScoreOverride(normalizePoolScore(Number(v)))
                      }
                    />
                  </div>
                  <p className="report-notes">
                    {visa} ·{" "}
                    {visa === "491"
                      ? "State/territory nominated regional"
                      : visa === "190"
                        ? "State/territory nominated"
                        : "Skilled Independent"}{" "}
                    · Submitted EOIs · {formatDate(evidence.snapshotDate)}
                  </p>
                  <div className="report-data-layout">
                    <div aria-live="polite">
                      <span className="pool-metric-label">
                        EOIs WITH HIGHER POINTS
                      </span>
                      <span className="report-number">
                        <AnimatedNumber value={formatInterval(pool.higher)} />
                      </span>
                      <p className="data-caption">
                        At <strong>{score} points</strong>, another{" "}
                        <strong>{formatInterval(pool.same)}</strong> share that
                        score.
                        <br />
                        Published occupation total:{" "}
                        <strong>{formatInterval(pathway.total)}</strong> EOIs.
                      </p>
                    </div>
                    <PoolChart
                      occupation={{
                        name: occupation.name,
                        points: pathway.points,
                      }}
                      score={score}
                    />
                  </div>
                  <div className="notice">
                    <Info size={15} />
                    <p>
                      This is a pool comparison, not your exact queue position.
                      Date-of-effect ordering is unavailable. Counts below 20
                      stay masked; EOIs are not unique people.{" "}
                      {visa === "491"
                        ? "This view includes state/territory nomination, excluding family sponsorship."
                        : ""}{" "}
                      <Link className="source-link" href="/methodology/#pool">
                        How to read the pool
                      </Link>
                    </p>
                  </div>
                  <div className="trend-heading">
                    <h3>Twelve months, in perspective.</h3>
                    <span className="pill">189 occupation totals</span>
                  </div>
                  <TrendChart rows={data.trend} />
                  {trendChange && (
                    <p className="data-caption">
                      Net change from {formatDate(data.trend[0].date)} to{" "}
                      {formatDate(data.trend.at(-1)!.date)}:{" "}
                      <strong>{formatInterval(trendChange)} EOIs</strong>. These
                      are published monthly totals. A net change does not reveal
                      new entries, invitations, withdrawals or score movement
                      separately.
                    </p>
                  )}
                </>
              ) : (
                <div className="report-empty">
                  <Info size={18} />
                  <p>
                    This occupation is not in the imported snapshot. Your points
                    are available; no pool comparison has been invented.
                  </p>
                </div>
              )}
            </section>
            <section className="report-section" id="rounds">
              <span className="section-label">04 / INVITATION HISTORY</span>
              <h2>
                What was published.
                <br />
                <em>Not a prediction.</em>
              </h2>
              <p>
                Six actual 189 invitation rounds, matched to the nominated
                occupation. A missing published row means “not listed”, rather
                than a zero cutoff or proof of no invitations.
              </p>
              {data ? (
                <table className="rounds-table">
                  <thead>
                    <tr>
                      <th scope="col">189 round date</th>
                      <th scope="col">Published minimum</th>
                      <th scope="col">Your current score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rounds.map((r) => (
                      <tr key={r.date}>
                        <td>{formatDate(r.date)}</td>
                        <td>
                          {r.cutoff === null ? (
                            <span className="subtle">Not listed</span>
                          ) : (
                            <strong>{r.cutoff} points</strong>
                          )}
                        </td>
                        <td>
                          {r.cutoff === null
                            ? "No comparison"
                            : result.base >= r.cutoff
                              ? `${result.base - r.cutoff} points above / at`
                              : `${r.cutoff - result.base} points below`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="report-empty">
                  Occupation-matched invitation results are unavailable for this
                  profile.
                </div>
              )}
              <p className="data-caption">
                Meeting a historical minimum does not mean your EOI would have
                been invited. Tie-break dates, occupation eligibility and EOI
                status also matter.{" "}
                <a
                  className="source-link"
                  href={evidence.roundsSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Current results
                </a>{" "}
                ·{" "}
                <a
                  className="source-link"
                  href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/previous-rounds"
                  target="_blank"
                  rel="noreferrer"
                >
                  Previous rounds
                </a>
              </p>
            </section>
            <section className="report-section" id="timeline">
              <span className="section-label">05 / YOUR PERSONAL DATES</span>
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
            <section className="report-section" id="states">
              <span className="section-label">06 / STATE PATHWAYS</span>
              <h2>
                Federal points.
                <br />
                <em>Different state systems.</em>
              </h2>
              <p>
                Victoria’s VPT, ACT’s Canberra Matrix and Tasmania’s attributes
                use separate criteria. These are sourced summaries, rather than
                a personal eligibility or selection assessment.
              </p>
              {statePrograms.map((s) => (
                <div className="report-state-row" key={s.code}>
                  <div>
                    <h3>
                      {s.name}
                      {profile.onshore && profile.state === s.code && (
                        <span className="pill">Your current state</span>
                      )}
                    </h3>
                    <p>
                      <strong>{s.system}.</strong> {s.summary}
                    </p>
                    {["WA", "NT"].includes(s.code) && (
                      <small>
                        Current cohort criteria need further verification.
                      </small>
                    )}
                  </div>
                  <a
                    className="source-link"
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Criteria <ArrowUpRight size={11} />
                  </a>
                </div>
              ))}
              <Link
                className="text-link"
                style={{ marginTop: 22, fontSize: 12 }}
                href="/states/"
              >
                Explore the detailed state summaries <ArrowRight size={14} />
              </Link>
            </section>
            <section className="report-section" id="compare">
              <span className="section-label">07 / OCCUPATION CONTEXT</span>
              <h2>
                A little more <em>perspective.</em>
              </h2>
              <p>
                Compare another occupation in this import at your current
                federal score. This is descriptive context; your assessment and
                occupation eligibility are separate requirements.
              </p>
              <Select
                label="Compare an occupation"
                searchable
                value={comparison}
                onChange={(v) => v && setComparison(v)}
                data={snapshot.occupations.map((o) => ({
                  value: o.code,
                  label: `${o.name} · ${o.code}`,
                }))}
              />
              <div className="compare-grid">
                {[
                  {
                    name: occupation?.name ?? "Your occupation",
                    p: data?.pathways.find((p) => p.visa === "189"),
                  },
                  { name: compared?.name ?? "Comparison", p: otherPool },
                ].map((item, i) => (
                  <div className="compare-card" key={i}>
                    <span>
                      {i === 0
                        ? "YOUR NOMINATED OCCUPATION"
                        : "COMPARISON OCCUPATION"}
                    </span>
                    <h3>{item.name}</h3>
                    {item.p ? (
                      <>
                        <strong>
                          {formatInterval(
                            comparePool(item.p, result.base).higher,
                          )}
                        </strong>
                        <small>
                          189 EOIs above {result.base} points ·{" "}
                          {formatDate(evidence.snapshotDate)}
                        </small>
                      </>
                    ) : (
                      <p className="data-caption">
                        No imported pool available.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <section className="report-section" id="prepare">
              <span className="section-label">08 / GET ORGANISED</span>
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
              <span className="section-label">09 / USEFUL DEFINITIONS</span>
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
                    Included: a self-reported points audit, hypothetical
                    credential scenarios, three dated occupation pools, twelve
                    monthly 189 totals, published invitation rounds, personal
                    dates, state summaries and preparation tools. Exact queue
                    rank, invitation dates, personal probabilities, a full state
                    eligibility engine, current ceiling utilisation and gross
                    EOI movements are unavailable here. These need additional
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
                  href={evidence.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Home Affairs SkillSelect dashboard
                </a>
                . Submitted EOIs; current snapshot{" "}
                {formatDate(evidence.snapshotDate)}; sources checked{" "}
                {formatDate(evidence.sourceCheckedAt)}. Monthly history uses
                directly published occupation totals. Score comparisons sum
                published score-band intervals. Counts below 20 remain masked.
                State 491 excludes family sponsorship.
              </p>
              <p>
                Rule set federal-current-2026-11 · Report v0.2. General
                information, not migration advice. Landfall is independent and
                is not a registered migration agent. Government material
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
            <Link className="button button-lime" href="/check/">
              Start my free check <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
