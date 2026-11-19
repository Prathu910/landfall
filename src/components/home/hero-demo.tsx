"use client";

import { useEffect, useMemo } from "react";
import type { DemoContent } from "../../lib/home/demo-content";
import { Stage, type Act } from "../stageshow-kit";
import { COMPACT, WIDE } from "./demo-layout";
import { DemoSheet } from "./demo-sheet";
import {
  EMPTY_SCENE,
  PAYOFF_SCENE,
  groupsOf,
  type DemoScene,
} from "./demo-scene";
import styles from "./hero-demo.module.css";

type State = DemoScene;

const START: State = PAYOFF_SCENE;
// Empty surface near the next press, in each design
const REST = { wide: { x: 500, y: 104 }, compact: { x: 222, y: 84 } };
// The cursor aims at a button's right end, clear of its words
const press = (at: string) => ({ at, x: 0.88, y: 0.66 });

function script(groupCount: number) {
  return async (a: Act<State>) => {
    // The loop opens on the finished report (the poster) and reads it.
    await a.wait(1000);
    a.mark("start-over");
    await a.move(press("start-over"));
    await a.click();
    await a.set({ ...EMPTY_SCENE });
    await a.wait(700);
    a.mark("sample");
    await a.move(press("sample"));
    await a.click();
    await a.set({ answered: true });
    await a.wait(1100);
    await a.set({ total: true });
    await a.wait(900);
    a.mark("open");
    await a.move(press("open"));
    await a.click();
    await a.set({ view: "report" });
    await a.wait(500);
    a.mark("count");
    // The published figures settle into place as they are: never a count
    // through numbers the data didn't publish (ruling B12).
    await a.set({ counted: true });
    await a.wait(2300);
    a.mark("states");
    for (let lit = 1; lit <= groupCount; lit++) {
      await a.set({ lit });
      await a.wait(1200);
    }
    await a.set({ lit: PAYOFF_SCENE.lit });
    a.mark("payoff");
    await a.move("rest");
    await a.wait(1700);
  };
}

/** The animated hero: the sample profile, its scorecard and its 190 states. */
export function HeroDemo({
  content,
  onReady,
}: {
  content: DemoContent;
  onReady?: () => void;
}) {
  useEffect(() => onReady?.(), [onReady]);
  const groupCount = groupsOf(content.tiles).length;
  // One script per demo: a new one would restart the stage
  const play = useMemo(() => script(groupCount), [groupCount]);
  return (
    <Stage<State>
      {...WIDE}
      compact={COMPACT}
      initial={START}
      poster={START}
      script={play}
      cursor={{ at: REST, ripple: true }}
      className={styles.stage}
    >
      {(s, _rect, layout) => (
        <>
          <DemoSheet content={content} scene={s} layout={layout} />
          <span
            data-target="rest"
            className={styles.rest}
            style={{ left: REST[layout].x, top: REST[layout].y }}
          />
        </>
      )}
    </Stage>
  );
}
