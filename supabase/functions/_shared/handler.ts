import {
  record,
  validateCalculation,
  validateFeedback,
  type CalculationSubmission,
  type FeedbackSubmission,
} from "../../../src/lib/submissions/contract.ts";

import {
  RequestError,
  allowedOrigins,
  preflight,
  readJson,
  response,
} from "./http.ts";
import { READ_TOKEN_TTL_MS, signReadToken } from "./read-token.ts";

import occupationIndex from "../../../src/data/occupation-index.json" with { type: "json" };
import manifest from "../../../src/data/manifest.json" with { type: "json" };

const occupationCodes = new Set(
  occupationIndex.map((occupation) => occupation.code),
);
type Kind = "calculation" | "feedback";
type Submission = CalculationSubmission | FeedbackSubmission;
type Dependencies = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  now?: () => number;
};
type Settings = {
  origins: string[];
  databaseUrl: string;
  serviceKey: string;
  turnstileSecret: string;
};
type Receipt = {
  status: "missing" | "conflict" | "created" | "existing";
  id: string;
};
const UPSTREAM_TIMEOUT_MS = 15_000;
function settings(env: Dependencies["env"]): Settings {
  return {
    origins: allowedOrigins(env),
    databaseUrl: env("SUPABASE_URL") ?? "",
    serviceKey: env("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    turnstileSecret: env("TURNSTILE_SECRET_KEY") ?? "",
  };
}
async function receipt(
  kind: Kind,
  submission: Submission,
  write: boolean,
  config: Settings,
  fetcher: typeof fetch,
): Promise<Receipt> {
  const result = await fetcher(
    `${config.databaseUrl.replace(/\/$/, "")}/rest/v1/rpc/submit_${kind}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
      },
      body: JSON.stringify({ p_submission: submission, p_write: write }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    },
  );
  if (!result.ok) throw new Error("Storage unavailable");
  const value: unknown = await result.json();
  if (
    !record(value) ||
    !["missing", "conflict", "created", "existing"].includes(
      String(value.status),
    ) ||
    value.id !== submission.id.toLowerCase()
  ) {
    throw new Error("Invalid storage response");
  }
  return value as Receipt;
}
async function verify(
  token: string,
  kind: Kind,
  origin: string,
  config: Settings,
  fetcher: typeof fetch,
): Promise<void> {
  const result = await fetcher(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: config.turnstileSecret, response: token }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    },
  );
  if (!result.ok) throw new Error("Verification unavailable");
  const value: unknown = await result.json();
  if (
    !record(value) ||
    value.success !== true ||
    value.action !== kind ||
    value.hostname !== new URL(origin).hostname
  ) {
    throw new RequestError(403, "Complete the spam check again.");
  }
}
/**
 * Ruling R4: the AI read is optional, so a missing secret or a signing failure
 * never fails the submission. Only a new, Turnstile-verified write earns a
 * token: a retry receipt skips Turnstile, so replaying it must not mint reads.
 */
async function readTokenField(
  id: string,
  dependencies: Dependencies,
): Promise<{ read_token?: string }> {
  const secret = dependencies.env("READ_TOKEN_SECRET");
  if (!secret) return {};
  try {
    const now = (dependencies.now ?? Date.now)();
    const token = await signReadToken(id, now + READ_TOKEN_TTL_MS, secret);
    return { read_token: token };
  } catch {
    return {};
  }
}
async function persisted(
  kind: Kind,
  result: Receipt,
  origin: string,
  dependencies: Dependencies,
  verified: boolean,
): Promise<Response | null> {
  if (result.status === "conflict")
    return response(
      409,
      {
        error:
          "This submission reference has different content. Start a new submission.",
      },
      origin,
    );
  if (result.status === "missing") return null;
  const earnsToken =
    kind === "calculation" && verified && result.status === "created";
  const token = earnsToken ? await readTokenField(result.id, dependencies) : {};
  return response(
    result.status === "created" ? 201 : 200,
    { id: result.id, ...token },
    origin,
  );
}
export function createHandler(kind: Kind, dependencies: Dependencies) {
  return async (request: Request): Promise<Response> => {
    let allowedOrigin: string | undefined;
    try {
      const config = settings(dependencies.env);
      const origin = request.headers.get("Origin");
      if (!origin || !config.origins.includes(origin))
        return response(403, { error: "This origin is not allowed." });
      allowedOrigin = origin;
      if (request.method === "OPTIONS") return preflight(request, origin);
      if (request.method !== "POST")
        return response(405, { error: "Use POST." }, origin);
      const envelope = await readJson(request);
      if (
        !record(envelope) ||
        Object.keys(envelope).length !== 2 ||
        !Object.hasOwn(envelope, "submission") ||
        typeof envelope.turnstile_token !== "string" ||
        !envelope.turnstile_token.trim() ||
        envelope.turnstile_token.length > 2048
      ) {
        throw new RequestError(
          400,
          "A submission and spam-check token are required.",
        );
      }
      const validated =
        kind === "calculation"
          ? validateCalculation(envelope.submission)
          : validateFeedback(envelope.submission);
      if (!validated.ok) throw new RequestError(400, validated.error);
      const summary = validated.value.summary;
      if (
        summary &&
        ((summary.occupation_code !== "points-only" &&
          !occupationCodes.has(summary.occupation_code)) ||
          summary.snapshot_id !== manifest.snapshotId)
      ) {
        throw new RequestError(
          400,
          "Refresh the page to use the current occupation data and try again.",
        );
      }
      if (!config.databaseUrl || !config.serviceKey || !config.turnstileSecret)
        throw new Error("Missing backend settings");
      const existing = await persisted(
        kind,
        await receipt(kind, validated.value, false, config, dependencies.fetch),
        origin,
        dependencies,
        false,
      );
      if (existing) return existing;
      await verify(
        envelope.turnstile_token,
        kind,
        origin,
        config,
        dependencies.fetch,
      );
      const saved = await persisted(
        kind,
        await receipt(kind, validated.value, true, config, dependencies.fetch),
        origin,
        dependencies,
        true,
      );
      if (!saved) throw new Error("Storage did not acknowledge persistence");
      return saved;
    } catch (error) {
      if (error instanceof RequestError)
        return response(error.status, { error: error.message }, allowedOrigin);
      return response(
        503,
        { error: "The submission service is unavailable. Please try again." },
        allowedOrigin,
      );
    }
  };
}
