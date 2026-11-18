import type { CSSProperties, ReactNode } from "react";
import type { DemoContent } from "../../lib/home/demo-content";
import { Bar, Window } from "../stageshow-kit/window";
import { groupsOf, splitLine, type DemoScene } from "./demo-scene";
import styles from "./demo-sheet.module.css";

export type SheetLayout = "wide" | "compact";

type Props = {
  content: DemoContent;
  scene: DemoScene;
  layout: SheetLayout;
  /** Draws a scorecard figure; the live demo counts it in. */
  figure?: (text: string) => ReactNode;
  /** Draws the button's two labels in one place; the live demo crossfades them. */
  action?: (cleared: boolean, labels: [string, string]) => ReactNode;
};

const order = (i: number, n: number) =>
  ({ "--i": i, "--n": n }) as CSSProperties;

function plainFigure(text: string) {
  return text;
}

/** Both labels in one grid cell, so the button keeps the longer one's width. */
function plainAction(cleared: boolean, [start, sample]: [string, string]) {
  return (
    <span className={styles.labels}>
      <span data-on={!cleared || undefined}>{start}</span>
      <span data-on={cleared || undefined}>{sample}</span>
    </span>
  );
}

/**
 * Wide, the report sits in a desktop window. A phone column is portrait, so
 * there it is the page itself: a sheet bled off the bottom.
 */
function Frame({
  layout,
  children,
}: {
  layout: SheetLayout;
  children: ReactNode;
}) {
  if (layout === "compact") {
    return (
      <div className={`${styles.page} ${styles.body}`} data-layout={layout}>
        {children}
      </div>
    );
  }
  return (
    <Window className={styles.window} data-layout={layout}>
      <div className={styles.body}>{children}</div>
    </Window>
  );
}

/**
 * The hero demo's one frame: the check's points beside the report's
 * scorecard and 190 state tiles, every word from `DemoContent`. Hook-free, so
 * the server renders it as the poster and the stage animates the same markup.
 */
export function DemoSheet({
  content,
  scene,
  layout,
  figure = plainFigure,
  action = plainAction,
}: Props) {
  const { labels } = content;
  const lines = content.profileLines.slice(0, -1).map(splitLine);
  const groups = groupsOf(content.tiles);
  const outlookVisa =
    content.cards.find((card) => card.visa.startsWith("190"))?.visa ?? "";
  const button = (
    <span className={styles.button} data-target="action" data-cursor="pointer">
      {action(scene.cleared, [labels.startOver, labels.trySample])}
    </span>
  );

  return (
    <Frame layout={layout}>
      <section className={styles.profile}>
        <div className={styles.head}>
          <span className={styles.slot}>
            <span className={styles.occupation} data-on={scene.answered}>
              {content.occupation}
            </span>
            <Bar className={styles.placeholder} w={128} h={7} tone={4} />
          </span>
          {layout === "compact" ? button : null}
        </div>
        <ul className={styles.lines}>
          {lines.map((line, i) => (
            <li key={line.label} className={styles.line}>
              <span className={styles.lineLabel}>{line.label}</span>
              <span className={styles.slot}>
                <span
                  className={styles.lineValue}
                  data-on={scene.answered}
                  style={order(i, lines.length)}
                >
                  {line.value}
                </span>
                <Bar className={styles.placeholder} w={26} h={6} tone={3} />
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <span className={styles.slot}>
            <span className={styles.totalValue} data-on={scene.total}>
              <span className={styles.totalNumber}>{content.points}</span>{" "}
              {labels.pointsUnit}
            </span>
            <Bar className={styles.placeholder} w={56} h={10} tone={3} />
          </span>
        </div>
        {layout === "wide" ? button : null}
      </section>

      <section className={styles.results}>
        <div className={styles.cards}>
          {content.cards.map((card, i) => (
            <div key={card.visa} className={styles.card}>
              <span className={styles.visa}>{card.visa}</span>
              <span className={styles.cardPoints}>
                {card.points} {labels.pointsUnit}
              </span>
              <span className={styles.slot}>
                <span
                  className={styles.ahead}
                  data-on={scene.counted}
                  style={order(i, content.cards.length)}
                >
                  {figure(card.ahead)}
                </span>
                <Bar className={styles.placeholder} w={64} h={12} tone={3} />
              </span>
              <span className={styles.aheadLabel}>{card.aheadLabel}</span>
              <span className={styles.atScore}>
                <span>{labels.atScore}</span>
                <span className={styles.slot}>
                  <span
                    className={styles.atScoreValue}
                    data-on={scene.counted}
                    style={order(i, content.cards.length)}
                  >
                    {figure(card.atScore)}
                  </span>
                  <Bar className={styles.placeholder} w={30} h={6} tone={3} />
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.outlook}>
          <div className={styles.outlookHead}>
            <span className={styles.outlookVisa}>{outlookVisa}</span>
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
      </section>
    </Frame>
  );
}
