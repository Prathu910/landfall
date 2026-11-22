import type { ReportSource } from "@/lib/data/report-source";
import type { Profile } from "@/lib/migration";
import { labelName } from "@/lib/outlook/labels";
import { printBrandLine, printPageStyle } from "@/lib/outlook/print-page";
import type { OutlookView, ReportOutlookView } from "@/lib/outlook/view";
import { BigStamp } from "./big-stamp";
import { CutoffColumns } from "./cutoff-columns";
import { ImproveSection } from "./improve-section";
import { MethodNote } from "./method-note";
import { OurRead } from "./our-read";
import { PassportBackground } from "./passport-background";
import { PointsPage } from "./points-page";
import { PrintAppendix } from "./print-appendix";
import { QueueSquares } from "./queue-squares";
import { ReportFooter } from "./report-footer";
import { RouteLine } from "./route-line";
import section from "./section.module.css";
import type { OurReadResult } from "./use-our-read";
import { VisaRow } from "./visa-row";
import styles from "./print-report.module.css";

type Props = {
  view: OutlookView;
  profile: Profile;
  asOf: string;
  source: ReportSource;
  read: OurReadResult;
};

// Leaves room for the page margins on A4; the route keeps its text at 12px+.
const ROUTE_PRINT_WIDTH = 700;

function BrandLine({
  profile,
  asOf,
  source,
}: Pick<Props, "profile" | "asOf" | "source">) {
  return (
    <header className={styles.brandline}>
      <b>MigrateLens</b>
      <span>{printBrandLine(profile.name, asOf, source.snapshotDate)}</span>
    </header>
  );
}

/** Page 1's verdict: text, tiles and Our read on the left, the stamp on the right. */
function PrintHero({
  view,
  read,
}: {
  view: ReportOutlookView;
  read: OurReadResult;
}) {
  const { headline, stamp } = view;
  return (
    <section className={styles.hero}>
      <PassportBackground print />
      <div className={styles.heroText}>
        <p className={styles.who}>
          <b>{headline.who}</b> {view.whoDetail}
        </p>
        <h1 className={styles.h1}>{headline.h1}</h1>
        <p className={styles.fact}>{headline.fact}</p>
        <dl className={styles.tiles}>
          <div>
            <dt>Best route</dt>
            <dd>{headline.best}</dd>
          </div>
          <div>
            <dt>Estimated wait</dt>
            <dd>{view.wait}</dd>
          </div>
        </dl>
        {/* While pending, read.text is the template, so paper never says "Writing". */}
        <OurRead text={read.text} source={read.source} />
        <p className={styles.why}>{headline.why}</p>
      </div>
      <div className={styles.stamp}>
        {/* The inked stamp prints as an image; this keeps its words in the
            PDF's text layer for search, copy and screen readers. */}
        <span className={styles.stampText}>
          Stamp: {view.stampRing}, {labelName(stamp.label, stamp.tooFew)}.
        </span>
        <BigStamp
          label={stamp.label}
          ring={view.stampRing}
          bottom={view.stampBottom}
          tooFew={stamp.tooFew}
          decorative
        />
      </div>
    </section>
  );
}

/** Page 2 opens with both charts side by side, drawn at their narrow size. */
function PrintCharts({ view }: { view: ReportOutlookView }) {
  return (
    <section className={`${section.band} ${styles.pageBreak}`}>
      <div className={section.two}>
        <div>
          <h2 className={section.h3}>Last 6 cut-offs</h2>
          <p className={section.sub}>189 rounds for your occupation.</p>
          {view.cutoffs ? (
            <CutoffColumns data={view.cutoffs} narrow />
          ) : (
            <p className={section.empty}>{view.cutoffsEmpty}</p>
          )}
        </div>
        <div>
          <h2 className={section.h3}>
            {view.queue?.title ?? "Who's in the queue"}
          </h2>
          <p className={section.sub}>EOIs in the 189 pool, by points.</p>
          {view.queue ? (
            <QueueSquares data={view.queue} narrow />
          ) : (
            <p className={section.empty}>{view.queueEmpty}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function PrintRoute({ view }: { view: ReportOutlookView }) {
  return (
    <section className={`${section.band} ${styles.keep}`}>
      <h2 className={section.h2}>Your best route</h2>
      <p className={section.sub}>
        What we&apos;d do with your profile, in order, and the dates that work
        against you.
      </p>
      <RouteLine route={view.route} width={ROUTE_PRINT_WIDTH} />
    </section>
  );
}

/**
 * Points, the label rules and the guarantee box follow the plan. Each keeps
 * itself whole, so they share a page where they fit without forcing a
 * near-empty page when the plan runs long.
 */
function PrintProfile({
  view,
}: {
  view: Exclude<OutlookView, { kind: "loading" }>;
}) {
  return (
    <>
      <div className={styles.keep}>
        <PointsPage
          page={view.pointsPage}
          warnings={view.points.warnings}
          anchor={false}
        />
      </div>
      {view.kind === "report" && (
        <div className={styles.keep}>
          <MethodNote lines={view.methodLines} anchor={false} />
        </div>
      )}
      <ReportFooter text={view.footer} />
    </>
  );
}

function PrintPages({
  view,
  read,
}: {
  view: ReportOutlookView;
  read: OurReadResult;
}) {
  return (
    <>
      <PrintHero view={view} read={read} />
      <VisaRow visas={view.visas} anchor={false} />
      <PrintCharts view={view} />
      <PrintRoute view={view} />
      <ImproveSection
        improve={view.improve}
        labels={view.improveLabels}
        anchor={false}
      />
    </>
  );
}

/**
 * The A4 layout (spec 11), rendered after the screen report and shown only in
 * print, so print never inherits phone styles. It stays laid out off screen
 * so the stamps can fit their words before the print dialog opens.
 */
export function PrintReport({ view, profile, asOf, source, read }: Props) {
  if (view.kind === "loading") return null;
  return (
    <div className={styles.root}>
      <style
        // Escaped in printPageStyle: a name can't end the string or the element.
        dangerouslySetInnerHTML={{
          __html: printPageStyle(profile.name, view.dataMonth),
        }}
      />
      <BrandLine profile={profile} asOf={asOf} source={source} />
      {view.kind === "report" ? (
        <PrintPages view={view} read={read} />
      ) : (
        <section className={styles.pointsOnly}>
          <h1 className={styles.h1}>You have {view.points.base} points.</h1>
          <p className={styles.fact}>{view.line}</p>
        </section>
      )}
      <PrintProfile view={view} />
      {view.kind === "report" && (
        <PrintAppendix evidence={view.evidence} source={source} />
      )}
    </div>
  );
}
