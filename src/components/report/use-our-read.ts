"use client";
import { useEffect, useRef, useState } from "react";
import { checkRead } from "../../lib/outlook/read-contract";
import type { ReportFacts } from "../../lib/outlook/read-contract";
import { configuredSubmissions } from "../submissions/config";

export type OurReadResult = {
  text: string;
  source: "ai" | "template";
  pending: boolean;
};

const WAIT_MS = 6000;
/** The server allows each token three reads; stop before it answers 429. */
const MAX_CALLS_PER_TOKEN = 3;

/** The reply is used only if it passes the same check the server ran. */
export function decideRead(
  reply: string | null,
  facts: ReportFacts,
  template: string,
): { text: string; source: "ai" | "template" } {
  if (reply !== null && checkRead(reply, facts).ok) {
    return { text: reply, source: "ai" };
  }
  return { text: template, source: "template" };
}

async function fetchRead(
  token: string,
  facts: ReportFacts,
  signal: AbortSignal,
): Promise<string | null> {
  const config = configuredSubmissions();
  if (!config) return null;
  try {
    const response = await fetch(`${config.url}/functions/v1/write-read`, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, facts }),
      signal,
    });
    if (response.status !== 200) return null;
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "read" in body) {
      return typeof body.read === "string" ? body.read : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * "Our read" text: the template unless the AI switch is on, the reader has a
 * token and a reply passes `checkRead` within six seconds. Facts change when a
 * Sharpen answer changes the profile, so it refetches then, up to three calls
 * per token; after the third call, any further change in facts or template
 * shows the template, because no more AI reads are requested.
 */
export function useOurRead(
  facts: ReportFacts | null,
  template: string,
  token: string | null,
  enabled: boolean,
): OurReadResult {
  const [result, setResult] = useState<{
    key: string;
    text: string;
    source: "ai" | "template";
  } | null>(null);
  const calls = useRef({ token: "", count: 0 });
  const active = enabled && !!token && facts !== null;
  const factsKey = facts ? JSON.stringify(facts) : "";
  const key = `${token ?? ""}|${factsKey}|${template}`;

  useEffect(() => {
    if (!active || !token || !facts) return;
    if (calls.current.token !== token) calls.current = { token, count: 0 };
    if (calls.current.count >= MAX_CALLS_PER_TOKEN) {
      setResult({ key, ...decideRead(null, facts, template) });
      return;
    }
    calls.current.count += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WAIT_MS);
    let current = true;
    fetchRead(token, facts, controller.signal).then((reply) => {
      if (!current) return;
      setResult({ key, ...decideRead(reply, facts, template) });
    });
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
    // `key` covers token, facts and template by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);

  if (!active) return { text: template, source: "template", pending: false };
  if (result && result.key === key) {
    return { text: result.text, source: result.source, pending: false };
  }
  return { text: template, source: "template", pending: true };
}
