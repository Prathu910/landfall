import {
  record,
  validateCalculation,
  validateFeedback,
  type CalculationSubmission,
  type FeedbackSubmission,
} from "../../../src/lib/submissions/contract.ts";

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
const BODY_LIMIT = 16 * 1024;
const UPSTREAM_TIMEOUT_MS = 15_000;
class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
function settings(env: Dependencies["env"]): Settings {
  const origins = (env("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    !origins.length ||
    origins.some((origin) => {
      try {
        const parsed = new URL(origin);
        return (
          !["https:", "http:"].includes(parsed.protocol) ||
          parsed.origin !== origin
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error("Invalid server origin configuration");
  return {
    origins,
    databaseUrl: env("SUPABASE_URL") ?? "",
    serviceKey: env("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    turnstileSecret: env("TURNSTILE_SECRET_KEY") ?? "",
  };
}
function response(status: number, body: unknown, origin?: string): Response {
  const headers = new Headers({
    Vary: "Origin",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    "Content-Type": "application/json",
    Allow: "POST, OPTIONS",
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  if (status === 204) {
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "content-type");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers,
  });
}
async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new RequestError(415, "Send application/json.");
  }
  if (Number(request.headers.get("Content-Length")) > BODY_LIMIT) {
    await request.body?.cancel();
    throw new RequestError(413, "The submission is too large.");
  }
  if (!request.body) throw new RequestError(400, "A submission is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > BODY_LIMIT) {
        await reader.cancel();
        throw new RequestError(413, "The submission is too large.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RequestError(400, "Send valid JSON.");
  }
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
function persisted(result: Receipt, origin: string): Response | null {
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
  return response(
    result.status === "created" ? 201 : 200,
    { id: result.id },
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
      if (request.method === "OPTIONS") {
        const method = request.headers.get("Access-Control-Request-Method");
        const headers = (
          request.headers.get("Access-Control-Request-Headers") ?? ""
        )
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);
        if (
          (method && method !== "POST") ||
          headers.some((header) => header !== "content-type")
        )
          return response(400, { error: "Unsupported preflight." }, origin);
        return response(204, null, origin);
      }
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
      const existing = persisted(
        await receipt(kind, validated.value, false, config, dependencies.fetch),
        origin,
      );
      if (existing) return existing;
      await verify(
        envelope.turnstile_token,
        kind,
        origin,
        config,
        dependencies.fetch,
      );
      const saved = persisted(
        await receipt(kind, validated.value, true, config, dependencies.fetch),
        origin,
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
