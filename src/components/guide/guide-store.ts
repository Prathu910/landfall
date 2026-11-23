"use client";
import { useEffect, useSyncExternalStore } from "react";
import { occupationIndex } from "@/components/data/occupation-index";
import type { StateCode } from "@/lib/data/types";

/**
 * The occupation and "where are you now?" answers shared by the guide's
 * interactive leaves on one page (picker, quick check, cost estimator), so a
 * reader answers once. In memory only: nothing is stored or put in the URL.
 */
export type GuideAnswers = {
  occupation: string;
  situation: "offshore" | "onshore";
  state: StateCode | null;
};

const INITIAL: GuideAnswers = {
  occupation: "",
  situation: "offshore",
  state: null,
};

let answers = INITIAL;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setGuideAnswers(patch: Partial<GuideAnswers>) {
  answers = { ...answers, ...patch };
  listeners.forEach((listener) => listener());
}

/** The shared answers; the server and first render use the empty defaults. */
export function useGuideAnswers(): GuideAnswers {
  return useSyncExternalStore(
    subscribe,
    () => answers,
    () => INITIAL,
  );
}

/**
 * Reads the one allowed query parameter, `?occupation=<code>`, after
 * hydration so the static HTML matches the first render.
 */
export function useOccupationFromUrl() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("occupation");
    if (
      code &&
      !answers.occupation &&
      occupationIndex.some((o) => o.code === code)
    ) {
      setGuideAnswers({ occupation: code });
    }
  }, []);
}
