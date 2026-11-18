import type { ReactNode } from "react";
import type { ChangeItem } from "../../lib/report/what-could-change";
import type { EoisLikeYours as EoisView } from "../../lib/report/eois-like-yours";
import type {
  RoundsBlock,
  SameScore,
  WhereYouStand,
} from "../../lib/report/panel-189";
import { EoisLikeYours } from "./eois-like-yours";
import { LoadingData } from "./loading-data";
import { NoteWithLink } from "./note-with-link";
import styles from "./panel-189.module.css";
import { QueueBar } from "./queue-bar";
import { RoundsTiles } from "./rounds-tiles";

type Props = {
  whereYouStand: WhereYouStand;
  trend: ReactNode | null;
  sameScore: SameScore;
  rounds: RoundsBlock;
  eois: EoisView;
  changes: ChangeItem[];
  source: string;
};

function Stand({ view }: { view: WhereYouStand }) {
  if ("unavailable" in view)
    return <p className={styles.note}>{view.unavailable}</p>;
  return (
    <>
      <QueueBar segments={view.segments} />
      <p className={styles.lead}>{view.sentence}</p>
      <NoteWithLink note={view.queueNote} className={styles.note} />
    </>
  );
}

function SameScoreBlock({ view }: { view: SameScore }) {
  switch (view.kind) {
    case "loading":
      return <LoadingData />;
    case "split":
      return (
        <>
          <p className={styles.lead}>{view.sentence}</p>
          <p className={styles.note}>{view.note}</p>
        </>
      );
    default:
      return <p className={styles.note}>{view.text}</p>;
  }
}

function Block({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.block} aria-labelledby={id}>
      <h3 id={id} className={styles.h3}>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function Panel189(props: Props) {
  const { whereYouStand, trend, sameScore, rounds, eois, changes, source } =
    props;
  return (
    <section
      id="visa-189"
      tabIndex={-1}
      aria-labelledby="visa-189-heading"
      className={styles.panel}
    >
      <p className={styles.eyebrow}>Subclass 189</p>
      <h2 id="visa-189-heading" className={styles.h2}>
        189 · Skilled Independent — in detail
      </h2>
      <p className={styles.source}>{source}</p>
      <Block id="visa-189-stand" title="Where you stand">
        <Stand view={whereYouStand} />
        {trend}
      </Block>
      <Block id="visa-189-score" title="Among your score">
        <SameScoreBlock view={sameScore} />
      </Block>
      <Block id="visa-189-rounds" title="Recent 189 rounds for your occupation">
        <RoundsTiles rounds={rounds} />
      </Block>
      <Block id="visa-189-eois" title="What happened to EOIs like yours">
        <EoisLikeYours view={eois} />
      </Block>
      {changes.length ? (
        <Block id="visa-189-change" title="What could change your position">
          <ul className={styles.changes}>
            {changes.map((c) => (
              <li key={`${c.href}-${c.label}`}>
                <a href={c.href}>
                  {c.label} · {c.effect}
                </a>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
    </section>
  );
}
