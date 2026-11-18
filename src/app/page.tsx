import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Check,
  Fingerprint,
  Globe2,
  Layers3,
  MoveUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { HomeExperience } from "@/components/home-experience";
import { Reveal } from "@/components/reveal";
import { toPoolOccupation } from "@/lib/data/legacy";
import { loadOccupationCore } from "@/lib/data/load-server";
import { monthEnd } from "@/lib/data/report-source";

/** The explorer opens on ICT Business Analyst, rendered into the static HTML. */
const EXPLORER_OCCUPATION = "261111";

function explorerPool() {
  const core = loadOccupationCore(EXPLORER_OCCUPATION);
  const pool = core && toPoolOccupation(core);
  if (!core || !pool)
    throw new Error(
      `No 189 pool for explorer occupation ${EXPLORER_OCCUPATION}`,
    );
  return { pool, snapshotDate: monthEnd(core.asAt) };
}

export default function Home() {
  const explorer = explorerPool();
  return (
    <main id="main">
      <section className="hero container">
        <div className="hero-copy">
          <Link href="/sample/" className="announcement">
            <span className="status-dot" /> Your migration picture, brought
            together <ArrowRight size={13} />
          </Link>
          <h1>
            A big decision.
            <br />A <em>clearer</em>
            <br />
            way forward.
          </h1>
          <p className="hero-description">
            Your points. Your possibilities. The dates that matter. Make sense
            of Australian skilled migration, with a picture built around you.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/check/">
              Find where I stand <ArrowUpRight size={18} />
            </Link>
            <Link className="quiet-link" href="/sample/">
              Explore the report <ArrowRight size={15} />
            </Link>
          </div>
          <p className="hero-micro">
            <Check size={14} /> Free to explore <span>·</span> No account needed
          </p>
          <div className="hero-proof">
            <span>
              <strong>3</strong> skilled visa pathways
            </span>
            <i />
            <span>
              <strong>8</strong> state perspectives
            </span>
            <i />
            <span>
              <Fingerprint size={18} /> Private by design
            </span>
          </div>
        </div>
        <HomeExperience
          initialPool={explorer.pool}
          snapshotDate={explorer.snapshotDate}
        />
      </section>
      <div className="trust-strip">
        <div className="container">
          <span>
            <Globe2 size={17} /> Published Home Affairs data
          </span>
          <span>
            <ChartNoAxesColumnIncreasing size={17} /> Transparent calculations
          </span>
          <span>
            <Fingerprint size={17} /> Your answers stay in your browser
          </span>
          <Link href="/methodology/">
            Explore our sources <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <section className="section container" id="how-it-works">
        <Reveal className="section-heading">
          <div>
            <span className="eyebrow">01 / CONNECT THE DOTS</span>
            <h2>
              Less noise.
              <br />
              <em>More perspective.</em>
            </h2>
          </div>
          <p>
            Turn scattered rules and government tables into something you can
            actually understand. Start with your own profile.
          </p>
        </Reveal>
        <div className="value-grid">
          {[
            {
              n: "01",
              icon: SlidersHorizontal,
              title: "Know your numbers",
              text: "A transparent points audit, down to each category. Explore real changes and see their effect together.",
              link: "Check my points",
              href: "/check/",
              tag: "INTERACTIVE POINTS AUDIT",
            },
            {
              n: "02",
              icon: CalendarDays,
              title: "See what changes next",
              text: "Birthdays, evidence windows and your EOI. One timeline for the dates that can change your picture.",
              link: "Explore the timeline",
              href: "/sample/#timeline",
              tag: "YOUR PERSONAL TIMELINE",
            },
            {
              n: "03",
              icon: Layers3,
              title: "Explore the possibilities",
              text: "Compare published occupation pools, invitation history and the different systems behind state nomination.",
              link: "Open the sample report",
              href: "/sample/",
              tag: "SOURCE-BACKED CONTEXT",
            },
          ].map((item, i) => (
            <Reveal key={item.n} delay={i * 0.08}>
              <article className="value-item">
                <div className="value-top">
                  <span className="feature-icon">
                    <item.icon size={22} />
                  </span>
                  <span>{item.n}</span>
                </div>
                <small>{item.tag}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link className="text-link" href={item.href}>
                  {item.link}
                  <ArrowUpRight size={15} />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="pathways-section">
        <div className="container pathways-layout">
          <Reveal>
            <span className="eyebrow">02 / UNDERSTAND THE PATHWAYS</span>
            <h2>
              One profile.
              <br />
              <em>Different possibilities.</em>
            </h2>
            <p>
              Federal points are a starting point. Each pathway has a different
              selection process and its own requirements.
            </p>
            <Link href="/states/" className="text-link">
              Explore all eight jurisdictions <ArrowRight size={16} />
            </Link>
            <div className="pathway-note">
              <Globe2 size={20} />
              <span>
                State systems change.
                <br />
                Sources and limitations stay visible.
              </span>
            </div>
          </Reveal>
          <div className="pathway-list">
            {[
              {
                visa: "189",
                title: "Skilled Independent",
                kind: "Permanent",
                text: "Federal invitations, occupation-specific results and points ranking. A higher score is context, never a guarantee.",
                points: "Your federal points",
              },
              {
                visa: "190",
                title: "Skilled Nominated",
                kind: "Permanent",
                text: "State or territory nomination, with its own criteria, priorities and selection process.",
                points: "+5 if nominated",
              },
              {
                visa: "491",
                title: "Skilled Work Regional",
                kind: "Provisional",
                text: "A regional pathway through state nomination or eligible family sponsorship. Further requirements apply for permanent residence.",
                points: "+15 if nominated or sponsored",
              },
            ].map((p, i) => (
              <Reveal delay={i * 0.07} key={p.visa}>
                <Link
                  className="pathway-row"
                  href={p.visa === "189" ? "/sample/#pool" : "/states/"}
                >
                  <span className="visa-number">{p.visa}</span>
                  <div>
                    <div className="pathway-title">
                      <h3>{p.title}</h3>
                      <span className="pill">{p.kind}</span>
                    </div>
                    <p>{p.text}</p>
                    <span className="pathway-points">{p.points}</span>
                  </div>
                  <MoveUpRight size={18} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <Reveal className="timeline-feature">
          <div>
            <span className="eyebrow light">03 / THINK AHEAD</span>
            <h2>
              Your score has
              <br />
              <em>a story over time.</em>
            </h2>
            <p>
              The number today is only part of your picture. Bring the dates
              together and understand what might change under current rules.
            </p>
            <Link href="/sample/#timeline" className="button button-accent">
              Explore a personal timeline <ArrowUpRight size={17} />
            </Link>
            <small>From Aarav’s illustrative sample profile</small>
          </div>
          <div className="timeline-preview">
            <div className="timeline-preview-top">
              <CalendarDays size={18} />
              <span>THE DATES THAT MATTER</span>
              <span className="pill timeline-pill">3-year outlook</span>
            </div>
            {[
              {
                day: "09",
                month: "AUG 2027",
                title: "The age points change",
                text: "33rd birthday · 30 → 25 age points",
                badge: "−5 points",
              },
              {
                day: "30",
                month: "SEP 2027",
                title: "Current visa expiry",
                text: "A date entered in the sample profile",
                badge: "Personal date",
              },
              {
                day: "02",
                month: "FEB 2028",
                title: "English evidence window ends",
                text: "Three years from the test date",
                badge: "−20 points",
              },
            ].map((e) => (
              <div className="preview-event" key={e.month}>
                <span className="event-date">
                  <b>{e.day}</b>
                  {e.month}
                </span>
                <span className="timeline-node" />
                <div>
                  <span className="pill timeline-pill">{e.badge}</span>
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="section container honest-section">
        <Reveal>
          <span className="eyebrow">BUILT ON CLARITY</span>
          <h2>
            Confidence starts
            <br />
            <em>with honest data.</em>
          </h2>
        </Reveal>
        <Reveal className="honest-copy">
          <p>
            You deserve to know what’s published, what’s calculated, and where
            the data stops.
          </p>
          {[
            "An official source and date behind the numbers",
            "Masked counts stay uncertain",
            "No invented queue positions or waiting times",
          ].map((t) => (
            <div key={t}>
              <span className="check-icon">
                <Check size={16} />
              </span>
              <span>{t}</span>
            </div>
          ))}
          <Link href="/methodology/" className="text-link">
            Read our methodology <ArrowRight size={15} />
          </Link>
        </Reveal>
      </section>
      <section className="final-cta">
        <div className="cta-orbit" />
        <div className="container">
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS WITH CONTEXT</span>
          <h2>
            A clearer picture.
            <br />
            <em>Made for you.</em>
          </h2>
          <p>A few details. Your points, possibilities and personal dates.</p>
          <Link href="/check/" className="button button-accent">
            Start my free check <ArrowUpRight size={18} />
          </Link>
          <span className="cta-note">
            No account. No payment. Your answers stay with you.
          </span>
        </div>
      </section>
    </main>
  );
}
