"use client";
import { useEffect, useRef, useState } from "react";
import type { StateRuleData } from "@/lib/report/state-outlook-view";

export type StateRuleDataState =
  /** "idle" until the chunk arrives: the picker shows "Loading published data…". */
  { status: "idle" | "failed" } | { status: "ready"; data: StateRuleData };

/**
 * The state rules and imported lists, fetched as their own chunk the first
 * time `wanted` is true, so a guide page's first load carries none of them.
 */
export function useStateRuleData(wanted: boolean): StateRuleDataState {
  const [state, setState] = useState<StateRuleDataState>({ status: "idle" });
  const started = useRef(false);
  useEffect(() => {
    if (!wanted || started.current) return;
    started.current = true;
    import("@/components/data/state-rule-data")
      .then((m) => setState({ status: "ready", data: m.stateRuleData }))
      .catch(() => setState({ status: "failed" }));
  }, [wanted]);
  return state;
}
