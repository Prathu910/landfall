import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { RecapBand } from "@/components/updates/recap-band";
import { RecapCta } from "@/components/updates/recap-cta";
import hero from "@/components/updates/recap-hero.module.css";
import parts from "@/components/updates/recap-parts.module.css";
import { RoundStamp } from "@/components/updates/round-stamp";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/site";
import {
  buildUpdatesIndex,
  UPDATES_INDEX_H1,
  UPDATES_INDEX_INTRO,
  UPDATES_INDEX_PATH,
  UPDATES_INDEX_TITLE,
  updatesIndexDescription,
  updatesIndexJsonLd,
  type UpdatesIndexView,
} from "@/lib/updates/index-view";
import { listRecapMonths, loadRecap } from "@/lib/updates/load-server";
import styles from "./page.module.css";

const LATEST_ID = "updates-latest-heading";
const MONTHS_ID = "updates-months-heading";

function indexView(): UpdatesIndexView {
  return buildUpdatesIndex(listRecapMonths().map((month) => loadRecap(month)));
}

export function generateMetadata(): Metadata {
  const description = updatesIndexDescription(indexView());
  return {
    // The layout's "· MigrateLens" template would repeat the brand (R20).
    title: { absolute: UPDATES_INDEX_TITLE },
    description,
    alternates: { canonical: UPDATES_INDEX_PATH },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: UPDATES_INDEX_TITLE,
      description,
      url: UPDATES_INDEX_PATH,
      images: [
        { url: "/og.png", width: 1200, height: 630, alt: UPDATES_INDEX_H1 },
      ],
    },
  };
}

/** The newest month: its passport stamp, headline and three figures. */
function LatestCard({ latest }: { latest: UpdatesIndexView["latest"] }) {
  const { stamp } = latest;
  return (
    <article className={styles.latest} aria-labelledby={LATEST_ID}>
      <RoundStamp
        top={stamp.top}
        word={stamp.middle}
        bottom={stamp.bottom}
        label={stamp.text}
        className={`${styles.stamp} ${styles[stamp.kind]}`}
      />
      <div>
        <p className={parts.kicker}>Latest update · {latest.month}</p>
        <h2 id={LATEST_ID} className={styles.latestTitle}>
          <Link href={latest.path}>{latest.headline}</Link>
        </h2>
        <dl className={styles.figures}>
          {latest.figures.map((figure) => (
            <div key={figure.label} className={styles.figure}>
              <dt>{figure.label}</dt>
              <dd>{figure.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={latest.path} className={hero.primary}>
          Read the {latest.month} update <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

function MonthList({ months }: { months: UpdatesIndexView["months"] }) {
  return (
    <RecapBand tone="paper" labelledBy={MONTHS_ID}>
      <p className={parts.kicker}>Every month, newest first</p>
      <h2 id={MONTHS_ID} className={parts.heading}>
        All SkillSelect updates
      </h2>
      <ol className={styles.months}>
        {months.map((month) => (
          <li key={month.path} className={styles.month}>
            <p className={styles.monthName}>{month.month}</p>
            <h3 className={styles.monthTitle}>
              <Link href={month.path}>{month.headline}</Link>
            </h3>
            <p className={styles.roundDate}>
              {month.roundDate ? (
                <time dateTime={month.roundDate}>{month.roundText}</time>
              ) : (
                month.roundText
              )}
            </p>
          </li>
        ))}
      </ol>
    </RecapBand>
  );
}

export default function UpdatesIndexPage() {
  const view = indexView();
  const ld = updatesIndexJsonLd(view);
  return (
    <main id="main" className={styles.page}>
      <div className={hero.band}>
        <div className={`${hero.shell} ${styles.head}`}>
          <nav className={hero.crumb} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={12} aria-hidden />
            <span aria-current="page">Updates</span>
          </nav>
          <p className={`${hero.eyebrow} ${styles.eyebrow}`}>
            SkillSelect updates
          </p>
          <h1 className={hero.title}>{UPDATES_INDEX_H1}</h1>
          <p className={hero.answer}>
            <strong>{view.answer}</strong> {UPDATES_INDEX_INTRO}
          </p>
          <LatestCard latest={view.latest} />
        </div>
      </div>
      <MonthList months={view.months} />
      <RecapCta tone="desk" />
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
