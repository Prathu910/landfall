"use client";

import { useEffect, useId } from "react";
import { useAnimate, useReducedMotion } from "motion/react";
import { HomeAction } from "@/components/home/controls/home-action";
import { InkFilter } from "./ink-filter";
import styles from "./sample-cta.module.css";

/** The ink stamp lands from above the page, and the page gives a little. */
const PRESS = { duration: 0.34, ease: [0.55, 0, 0.8, 0.2] } as const;

/**
 * One moment, once: as the section scrolls into view an ink stamp presses
 * into the blank "your stamp" outline on a passport page. The server renders
 * the pressed state, so no-JS, reduced motion and a section already in view
 * all stay static; the stamp is only lifted when the press can be watched.
 */
function usePress() {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = scope.current;
    if (reduced !== false || !root) return;
    if (root.getBoundingClientRect().top < window.innerHeight) return;
    const lifted = { opacity: 0, scale: 1.45, rotate: -14 };
    animate("[data-ink]", lifted, { duration: 0 });
    animate("[data-blank]", { opacity: 1 }, { duration: 0 });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate([
          ["[data-ink]", { opacity: 1, scale: 1, rotate: 0 }, PRESS],
          ["[data-blank]", { opacity: 0 }, { duration: 0.1, at: "-0.06" }],
          ["[data-page]", { scale: [1, 0.97, 1] }, { duration: 0.3, at: "<" }],
        ]);
      },
      { threshold: 0.6 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [animate, reduced, scope]);
  return scope;
}

function PassportPage() {
  const filterId = `${useId()}ink`;
  return (
    <div className={styles.page} data-page>
      <span className={styles.pageHead} aria-hidden="true">
        Visas
      </span>
      <svg className={styles.stamp} viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <InkFilter id={filterId} />
        </defs>
        <g className={styles.blank} data-blank>
          <circle cx="110" cy="110" r="92" />
          <text x="110" y="104">
            YOUR
          </text>
          <text x="110" y="140">
            STAMP
          </text>
        </g>
        <g className={styles.ink} data-ink>
          <g filter={`url(#${filterId})`} transform="rotate(-7 110 110)">
            <circle cx="110" cy="110" r="96" className={styles.ring} />
            <circle cx="110" cy="110" r="82" className={styles.innerRing} />
            <text x="110" y="104" className={styles.word}>
              YOUR
            </text>
            <text x="110" y="150" className={styles.word}>
              STAMP
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

/** The sample page's closing call to check your own points (screen only). */
export function SampleCta() {
  const scope = usePress();
  return (
    <section
      ref={scope}
      className={`${styles.cta} no-print`}
      aria-labelledby="sample-cta-title"
    >
      <PassportPage />
      <div className={styles.copy}>
        <h2 id="sample-cta-title">Check your own points</h2>
        <p>
          The free check shows your points and three visa stamps. A full report
          like this one, built from your own answers, is one step further.
        </p>
        <HomeAction href="/check/">Start my free check</HomeAction>
      </div>
    </section>
  );
}
