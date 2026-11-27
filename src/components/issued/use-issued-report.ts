"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/lib/migration";
import type { ReviseResponse } from "@/lib/orders/contract";
import type { ReportPayload } from "@/lib/report-issue/payload";
import { parseProfile } from "@/lib/profile-guard";
import { postGet, postRevise } from "../checkout/transport";

export type IssuedStatus =
  "loading" | "report" | "revoked" | "expired" | "not-found" | "error";

export type IssuedReport = {
  status: IssuedStatus;
  payload?: ReportPayload;
  /** The stored answers, for "Edit answers" (ruling R4). */
  profile?: Profile;
  revise: (profile: Profile) => Promise<ReviseResponse>;
  reload: () => void;
};

type Loaded = Pick<IssuedReport, "status" | "payload" | "profile">;

function isPayload(value: unknown): value is ReportPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { schema?: unknown }).schema === 1 &&
    typeof (value as { view?: unknown }).view === "object"
  );
}

async function fetchReport(token: string): Promise<Loaded> {
  try {
    const reply = await postGet(token);
    if (reply.kind === "report" && isPayload(reply.payload)) {
      const profile = parseProfile(reply.profile) ?? reply.payload.profile;
      return { status: "report", payload: reply.payload, profile };
    }
    if (
      reply.kind === "revoked" ||
      reply.kind === "expired" ||
      reply.kind === "not-found"
    )
      return { status: reply.kind };
    return { status: "error" };
  } catch {
    return { status: "error" };
  }
}

/**
 * The issued report behind a link token: one POST to report-get (the token
 * travels only in the body), and corrections through report-revise.
 */
export function useIssuedReport(token: string | null): IssuedReport {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetchReport(token).then((next) => {
      if (!cancelled) setLoaded(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token, generation]);
  const reload = useCallback(() => setGeneration((n) => n + 1), []);
  const revise = useCallback(
    async (profile: Profile): Promise<ReviseResponse> => {
      if (!token) return { kind: "error", code: "invalid" };
      let reply: ReviseResponse;
      try {
        reply = await postRevise({ token, profile });
      } catch {
        reply = { kind: "error", code: "busy" };
      }
      if (reply.kind === "revised") reload();
      return reply;
    },
    [token, reload],
  );
  return { ...loaded, revise, reload };
}
