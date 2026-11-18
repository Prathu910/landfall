import type { DemoContent } from "../../lib/home/demo-content";
import "../stageshow-kit/stage.css";
import { DemoSheet } from "./demo-sheet";
import { PAYOFF_SCENE, type SheetLayout } from "./demo-scene";
import styles from "./hero-demo.module.css";

function Frame({
  content,
  layout,
}: {
  content: DemoContent;
  layout: SheetLayout;
}) {
  return (
    <div className={`${styles.frame} ${styles[layout]}`}>
      <div
        className={`ss-stage ${styles.look}`}
        data-theme="light"
        data-palette="accent"
        data-fidelity="standard"
        data-layout={layout}
        data-still
      >
        <DemoSheet content={content} scene={PAYOFF_SCENE} layout={layout} />
      </div>
    </div>
  );
}

/**
 * The demo's payoff as static markup: the stage's own frame, scaled by CSS
 * alone, so it reads with no script, under reduced motion and in print.
 */
export function HeroDemoPoster({ content }: { content: DemoContent }) {
  return (
    <div className={styles.poster}>
      <Frame content={content} layout="wide" />
      <Frame content={content} layout="compact" />
    </div>
  );
}
