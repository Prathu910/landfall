import type { CSSProperties, ReactNode } from "react";
import type { DemoContent } from "../../lib/home/demo-content";
import { Bar, Window } from "../stageshow-kit/window";
import {
  groupsOf,
  splitLine,
  type DemoScene,
  type SheetLayout,
} from "./demo-scene";
import styles from "./demo-sheet.module.css";

type Figure = (text: string) => ReactNode;

type Props = {
  content: DemoContent;
  scene: DemoScene;
  layout: SheetLayout;
  /** Draws a scorecard figure; the live demo counts it in. */
  figure?: Figure;
};

type ViewProps = { content: DemoContent; scene: DemoScene };

const order = (i: number, n: number) =>
  ({ "--i": i, "--n": n }) as CSSProperties;

const plainFigure: Figure = (text) => text;

/** A value that arrives into its place, over a placeholder of its size. */
function Slot({
  on,
  bar,
  className,
  style,
  children,
}: {
  on: boolean;
  bar: number;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span className={styles.slot}>
      <span className={className} data-on={on} style={style}>
        {children}
      </span>
      <Bar className={styles.placeholder} w={bar} h={8} tone={3} />
    </span>
  );
}

function Total({ content, scene }: ViewProps) {
  return (
    <Slot on={scene.total} bar={72} className={styles.totalValue}>
      <span className={styles.totalNumber}>{content.points}</span>{" "}
      {content.labels.pointsUnit}
    </Slot>
  );
}

/** The check: the sample answers' points by category, then the total. */
function CheckView({ content, scene }: ViewProps) {
  const lines = content.profileLines.slice(0, -1).map(splitLine);
  return (
    <section className={styles.check} data-on={scene.view === "check"}>
      <Slot on={scene.answered} bar={160} className={styles.occupation}>
        {content.occupation}
      </Slot>
      <ul className={styles.fields}>
        {lines.map((line, i) => (
          <li key={line.label} className={styles.field}>
            <span className={styles.fieldLabel}>{line.label}</span>
            <span className={styles.fieldBox}>
              <Slot
                on={scene.answered}
                bar={44}
                className={styles.fieldValue}
                style={order(i, lines.length)}
              >
                {line.value}
              </Slot>
            </span>
          </li>
        ))}
      </ul>
      <span className={styles.rule} />
      <div className={styles.checkFoot}>
        <Total content={content} scene={scene} />
        <span className={styles.actions}>
          <span
            className={styles.button}
            data-target="sample"
            data-cursor="pointer"
          >
            {content.labels.trySample}
          </span>
          <span
            className={styles.button}
            data-variant="primary"
            data-target="open"
            data-cursor="pointer"
          >
            {content.labels.openOverview}
          </span>
        </span>
      </div>
    </section>
  );
}

function Cards({ content, scene, figure }: ViewProps & { figure: Figure }) {
  const { labels } = content;
  return (
    <div className={styles.cards}>
      {content.cards.map((card, i) => (
        <div key={card.visa} className={styles.card}>
          <span className={styles.title}>{card.title}</span>
          <Slot on={scene.answered} bar={64} className={styles.cardPoints}>
            {card.points} {labels.pointsUnit}
          </Slot>
          <Slot
            on={scene.counted}
            bar={88}
            className={styles.ahead}
            style={order(i, content.cards.length)}
          >
            {figure(card.ahead)}
          </Slot>
          <span className={styles.aheadLabel}>{card.aheadLabel}</span>
          <span className={styles.atScore}>
            <span>{labels.atScore}</span>
            <Slot
              on={scene.counted}
              bar={40}
              className={styles.atScoreValue}
              style={order(i, content.cards.length)}
            >
              {figure(card.atScore)}
            </Slot>
          </span>
        </div>
      ))}
    </div>
  );
}

function Outlook({ content, scene }: ViewProps) {
  const groups = groupsOf(content.tiles);
  const title = content.cards.find((card) => card.visa === "190")?.title;
  return (
    <div className={styles.outlook}>
      <div className={styles.outlookHead}>
        <span className={styles.title}>{title}</span>
        <span className={styles.legend}>
          {groups.map((group, g) => (
            <span
              key={group.tone}
              className={styles.chip}
              data-tone={group.tone}
              data-on={scene.lit > g}
            >
              {group.label}
            </span>
          ))}
        </span>
      </div>
      <div className={styles.tiles}>
        {content.tiles.map((tile) => {
          const g = groups.findIndex((group) => group.tone === tile.tone);
          const inGroup = content.tiles.filter((t) => t.tone === tile.tone);
          return (
            <span
              key={tile.state}
              className={styles.tile}
              data-tone={tile.tone}
              data-on={scene.lit > g}
              style={order(inGroup.indexOf(tile), inGroup.length)}
            >
              {tile.state}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** The report: who and what score, the scorecard, the 190 outlook. */
function ReportView({
  content,
  scene,
  figure,
}: ViewProps & { figure: Figure }) {
  return (
    <section className={styles.report} data-on={scene.view === "report"}>
      <div className={styles.strip}>
        <span className={styles.who}>
          <Slot on={scene.answered} bar={160} className={styles.occupation}>
            {content.occupation}
          </Slot>
          <Total content={content} scene={scene} />
        </span>
        <span
          className={styles.button}
          data-target="start-over"
          data-cursor="pointer"
        >
          {content.labels.startOver}
        </span>
      </div>
      <Cards content={content} scene={scene} figure={figure} />
      <Outlook content={content} scene={scene} />
    </section>
  );
}

/**
 * The hero demo's frame: the report, and the check that builds it, in one
 * window (wide) or as the page itself (compact, a portrait phone column).
 * Every word comes from `DemoContent`. Hook-free, so the server renders it as
 * the poster and the stage animates the same markup.
 */
export function DemoSheet({
  content,
  scene,
  layout,
  figure = plainFigure,
}: Props) {
  const views = (
    <div className={styles.views}>
      <ReportView content={content} scene={scene} figure={figure} />
      <CheckView content={content} scene={scene} />
    </div>
  );
  if (layout === "compact") {
    return (
      <div className={styles.page} data-layout={layout}>
        {views}
      </div>
    );
  }
  return (
    <Window className={styles.window} lights="grey" data-layout={layout}>
      {views}
    </Window>
  );
}
