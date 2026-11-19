"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { DemoContent } from "../../lib/home/demo-content";
import { HeroDemoPoster } from "./hero-demo-poster";
import styles from "./hero-demo.module.css";
import { shouldAnimate } from "./should-animate";

const HeroDemo = dynamic(
  () => import("./hero-demo").then((module) => module.HeroDemo),
  { ssr: false },
);

const REDUCE = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Reduced until the browser says otherwise, so the server never animates. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCE).matches,
    () => true,
  );
}

function useSeen(ref: React.RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setSeen(true);
      observer.disconnect();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return seen;
}

/**
 * The hero figure: the server-rendered poster first, then the live demo once
 * it is in view, only when motion is allowed. Print always shows the poster.
 */
export function HeroDemoLoader({ content }: { content: DemoContent }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const play = shouldAnimate(reduced, useSeen(ref));
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <figure ref={ref} className={styles.figure}>
      <figcaption className="sr-only">{content.posterAlt}</figcaption>
      <div
        className={styles.posterSlot}
        data-covered={(play && ready) || undefined}
        aria-hidden
        inert
      >
        <HeroDemoPoster content={content} />
      </div>
      {play ? (
        <div className={styles.demoSlot} aria-hidden inert>
          <HeroDemo content={content} onReady={onReady} />
        </div>
      ) : null}
    </figure>
  );
}
