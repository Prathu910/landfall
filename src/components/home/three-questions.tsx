import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sampleCaption, HOME_COPY } from "../../lib/home/home-copy";
import type { ReportView } from "../../lib/report/report-view";
import { OutcomeBar } from "../report/outcome-bar";
import { QueueBar } from "../report/queue-bar";
import { StateTile } from "../report/state-tile";
import styles from "./three-questions.module.css";

const COPY = HOME_COPY.questions;

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined)
    throw new Error(`The homepage needs the sample's ${what}`);
  return value;
}

function Question(props: {
  id: string;
  title: string;
  body: string;
  link: string;
  href: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <article className={styles.question} aria-labelledby={props.id}>
      <div className={styles.text}>
        <h3 id={props.id} className={styles.title}>
          {props.title}
        </h3>
        <p className={styles.body}>{props.body}</p>
        <Link className={styles.link} href={props.href}>
          {props.link}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <figure className={styles.visual}>
        {props.children}
        <figcaption className={styles.caption}>{props.caption}</figcaption>
      </figure>
    </article>
  );
}

/**
 * What the report answers, each shown with the sample report's own figure,
 * drawn by the report's components from the sample's view-models.
 */
export function ThreeQuestions({
  view,
  occupationName,
}: {
  view: ReportView;
  occupationName: string;
}) {
  const panels = required(view.panels, "189 panels");
  const outlook = required(view.stateOutlook, "state outlook");
  const stand = panels.whereYouStand;
  if ("unavailable" in stand) throw new Error(stand.unavailable);
  const eois = panels.eois;
  if (eois.kind !== "ready") throw new Error("The sample needs EOI outcomes");
  const pointsFor = (visa: string) =>
    required(
      view.scorecard.cards.find((card) => card.visa === visa),
      `${visa} scorecard card`,
    ).points;
  const groupLabels = new Map(
    outlook.panelsByVisa["190"].map((panel) => [panel.id, panel.groupLabel]),
  );

  return (
    <section className={styles.section} aria-labelledby="questions-heading">
      <h2 id="questions-heading" className={styles.heading}>
        {COPY.heading}
      </h2>
      <p className={styles.lede}>{COPY.lede}</p>
      <Question
        id="question-stand"
        {...COPY.stand}
        href="/sample/#charts"
        caption={sampleCaption(occupationName, "189", pointsFor("189"))}
      >
        <QueueBar segments={stand.segments} />
        <p className={styles.sentence}>{stand.sentence}</p>
      </Question>
      <Question
        id="question-outcomes"
        {...COPY.outcomes}
        href="/sample/#evidence"
        caption={sampleCaption(occupationName, "189", pointsFor("189"))}
      >
        <p className={styles.sentence}>{eois.sentence}</p>
        <OutcomeBar view={eois} withCounts />
        <p className={styles.note}>{eois.statusNote}</p>
        <p className={styles.note}>{eois.closedNote}</p>
      </Question>
      <Question
        id="question-states"
        {...COPY.states}
        href="/sample/#state-outlook"
        caption={sampleCaption(occupationName, "190", pointsFor("190"))}
      >
        <div className={styles.tiles}>
          {outlook.tilesByVisa["190"].map((tile) => (
            <StateTile
              key={tile.href}
              tile={tile}
              groupLabel={groupLabels.get(tile.href.slice(1)) ?? ""}
              href={`/sample/${tile.href}`}
            />
          ))}
        </div>
      </Question>
    </section>
  );
}
