"use client";

import { useEffect, useState } from "react";
import { isOccupationCore } from "../../lib/data/guards";
import { occupationDataUrl } from "../../lib/data/occupation-url";
import type {
  OccupationCore,
  OccupationIndexEntry,
} from "../../lib/data/types";

export type OccupationLoad =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; core: OccupationCore }
  | { status: "unavailable" };

type Settled = { code: string; load: OccupationLoad };

export function useOccupationCore(
  code: string | null,
  index: OccupationIndexEntry[],
): OccupationLoad {
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (code === null) return;
    const controller = new AbortController();
    const url = occupationDataUrl(code, index, "core");
    const finish = (load: OccupationLoad) => {
      if (!controller.signal.aborted) setSettled({ code, load });
    };
    if (url === null) {
      finish({ status: "unavailable" });
      return () => controller.abort();
    }
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("http"))))
      .then((value: unknown) =>
        finish(
          isOccupationCore(value)
            ? { status: "ready", core: value }
            : { status: "unavailable" },
        ),
      )
      .catch(() => finish({ status: "unavailable" }));
    return () => controller.abort();
  }, [code, index]);

  if (code === null) return { status: "idle" };
  if (settled !== null && settled.code === code) return settled.load;
  return { status: "loading" };
}
