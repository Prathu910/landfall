"use client";

import { useEffect, useState } from "react";

export type RecordLoad<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "unavailable" };

type Settled<T> = { url: string; load: RecordLoad<T> };

/**
 * Fetches `url` (null: nothing to fetch, so unavailable) and keeps the JSON
 * only if `guard` accepts it. `url` null with `enabled` false is idle. One
 * AbortController per url; a result for a stale url is never shown.
 */
export function useValidatedRecord<T>(
  enabled: boolean,
  url: string | null,
  guard: (value: unknown) => value is T,
): RecordLoad<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const key = url ?? "";

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const finish = (load: RecordLoad<T>) => {
      if (!controller.signal.aborted) setSettled({ url: key, load });
    };
    if (url === null) {
      finish({ status: "unavailable" });
      return () => controller.abort();
    }
    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("http"))))
      .then((value: unknown) =>
        finish(
          guard(value) ? { status: "ready", value } : { status: "unavailable" },
        ),
      )
      .catch(() => finish({ status: "unavailable" }));
    return () => controller.abort();
  }, [enabled, url, key, guard]);

  if (!enabled) return { status: "idle" };
  if (settled !== null && settled.url === key) return settled.load;
  return { status: "loading" };
}
