import { createHandler } from "../functions/_shared/handler.ts";
import { verifyReadToken } from "../functions/_shared/read.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
const origin = "https://migratelens.com";
const id = "c5fa65d5-f388-4a7b-940c-1b5b78c751bd";
const summary = {
  occupation_code: "261313",
  age_band: "25-32",
  location: "offshore",
  base_points: 75,
  points_190: 80,
  points_491: 90,
  snapshot_id: "skillselect-2026-10-31",
};
const calculation = {
  id,
  email: "Test@EXAMPLE.com",
  summary,
  privacy_version: "2026-11-20",
};
const feedback = {
  id,
  category: "bug",
  message: "A small test feedback message.",
  email: null,
  summary: null,
  privacy_version: "2026-11-20",
};
const env: Record<string, string> = {
  ALLOWED_ORIGINS: origin + ",http://localhost:3017",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-secret",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
};
function setup(
  kind: "calculation" | "feedback" = "calculation",
  opts: {
    receipt?: string;
    turnstile?: unknown;
    rpcFailure?: boolean;
    verificationFailure?: boolean;
    variables?: Record<string, string>;
    fetchOverride?: typeof fetch;
  } = {},
) {
  const calls: {
    url: string;
    body: Record<string, unknown>;
    signal: AbortSignal | null | undefined;
  }[] = [];
  const remote: typeof fetch = async (input, init) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body));
    calls.push({ url, body, signal: init?.signal });
    if (url.includes("siteverify")) {
      if (opts.verificationFailure) throw new Error("private upstream detail");
      return Response.json(
        opts.turnstile ?? {
          success: true,
          hostname: "migratelens.com",
          action: kind,
        },
      );
    }
    if (opts.rpcFailure)
      return Response.json({ message: "private SQL detail" }, { status: 500 });
    return Response.json({
      status: body.p_write ? "created" : (opts.receipt ?? "missing"),
      id,
    });
  };
  const handler = createHandler(kind, {
    env: (name: string) => (opts.variables ?? env)[name],
    fetch: opts.fetchOverride ?? remote,
  });
  function request(
    body: unknown = {
      submission: kind === "calculation" ? calculation : feedback,
      turnstile_token: "token",
    },
    init: RequestInit = {},
  ) {
    return handler(
      new Request("https://project.supabase.co/functions/v1/submit-" + kind, {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        ...init,
      }),
    );
  }
  return { handler, request, calls };
}
Deno.test(
  "persists a normalized calculation only after successful server verification",
  async () => {
    const { request, calls } = setup();
    const response = await request();
    equal(response.status, 201);
    equal(await response.json(), { id });
    equal(calls.length, 3);
    equal(calls[0].body.p_write, false);
    equal(calls[0].body.p_submission, {
      ...calculation,
      email: "Test@example.com",
    });
    equal(calls[1].body.secret, "test-turnstile-secret");
    equal(calls[2].body.p_write, true);
    equal(
      calls.every((call) => call.signal instanceof AbortSignal),
      true,
    );
    equal(response.headers.get("Access-Control-Allow-Origin"), origin);
    equal(response.headers.get("Vary"), "Origin");
    equal(response.headers.get("Cache-Control"), "no-store");
    equal(response.headers.get("X-Robots-Tag"), "noindex");
  },
);
Deno.test(
  "returns a read token that write-read accepts when its secret is set",
  async () => {
    const variables = { ...env, READ_TOKEN_SECRET: "test-read-secret" };
    const { request } = setup("calculation", { variables });
    const response = await request();
    equal(response.status, 201);
    const body = await response.json();
    equal(body.id, id);
    equal(typeof body.read_token, "string");
    equal(
      await verifyReadToken(body.read_token, Date.now(), "test-read-secret"),
      { ok: true, submissionId: id },
    );
    const report = setup("feedback", { variables });
    equal(await (await report.request()).json(), { id });
  },
);
Deno.test(
  "never mints a read token for a retry receipt, which skips Turnstile",
  async () => {
    const variables = { ...env, READ_TOKEN_SECRET: "test-read-secret" };
    const { request, calls } = setup("calculation", {
      receipt: "existing",
      variables,
    });
    const response = await request({
      submission: calculation,
      turnstile_token: "any replayed string",
    });
    equal(response.status, 200);
    equal(await response.json(), { id });
    equal(calls.length, 1);
  },
);
Deno.test(
  "accepts independent feedback with no email or report context",
  async () => {
    const { request, calls } = setup("feedback");
    equal((await request()).status, 201);
    equal(
      calls[0].url,
      "https://project.supabase.co/rest/v1/rpc/submit_feedback",
    );
    equal(calls[0].body.p_submission, feedback);
  },
);
Deno.test(
  "returns an identical persisted retry without consuming another Turnstile token",
  async () => {
    const { request, calls } = setup("calculation", { receipt: "existing" });
    const response = await request();
    equal(response.status, 200);
    equal(await response.json(), { id });
    equal(calls.length, 1);
  },
);
Deno.test("never overwrites a conflicting id", async () => {
  const { request, calls } = setup("calculation", { receipt: "conflict" });
  equal((await request()).status, 409);
  equal(calls.length, 1);
});
Deno.test(
  "handles configured-origin preflight without upstream calls",
  async () => {
    const { handler, calls } = setup();
    const response = await handler(
      new Request("https://project.supabase.co", {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      }),
    );
    equal(response.status, 204);
    equal(
      response.headers.get("Access-Control-Allow-Methods"),
      "POST, OPTIONS",
    );
    equal(response.headers.get("Access-Control-Allow-Headers"), "content-type");
    equal(calls.length, 0);
  },
);
Deno.test(
  "rejects missing, wildcard, path-bearing and non-allowlisted origins",
  async () => {
    for (const badOrigin of [
      "",
      "https://evil.example",
      "null",
      "https://migratelens.com/path",
    ]) {
      const { request, calls } = setup();
      const response = await request(undefined, {
        headers: { "content-type": "application/json", Origin: badOrigin },
      });
      equal(response.status, 403);
      equal(response.headers.get("Access-Control-Allow-Origin"), null);
      equal(calls.length, 0);
    }
    for (const allowed of ["*", origin + "/path", ""]) {
      const { request } = setup("calculation", {
        variables: { ...env, ALLOWED_ORIGINS: allowed },
      });
      equal((await request()).status, 503);
    }
  },
);
Deno.test(
  "rejects other methods, content types, malformed JSON and unknown fields",
  async () => {
    const { request, handler, calls } = setup();
    equal(
      (
        await handler(
          new Request("https://project.supabase.co", {
            method: "GET",
            headers: { Origin: origin },
          }),
        )
      ).status,
      405,
    );
    equal(
      (
        await request(undefined, {
          headers: { Origin: origin, "Content-Type": "text/plain" },
        })
      ).status,
      415,
    );
    equal((await request(undefined, { body: "{" })).status, 400);
    equal(
      (
        await request({
          submission: { ...calculation, exact_birthdate: "1990-01-01" },
          turnstile_token: "token",
        })
      ).status,
      400,
    );
    equal(
      (
        await request({
          submission: calculation,
          turnstile_token: "token",
          extra: true,
        })
      ).status,
      400,
    );
    equal(
      (await request({ submission: calculation, turnstile_token: "" })).status,
      400,
    );
    equal(calls.length, 0);
  },
);
Deno.test(
  "caps streamed bodies even without an honest Content-Length",
  async () => {
    const { handler, calls } = setup();
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(9000));
      },
      cancel() {
        cancelled = true;
      },
    });
    const response = await handler(
      new Request("https://project.supabase.co", {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          "Content-Length": "1",
        },
        body,
      }),
    );
    equal(response.status, 413);
    equal(cancelled, true);
    equal(calls.length, 0);
  },
);
Deno.test(
  "rejects Turnstile failures, wrong action, and hostname without writing",
  async () => {
    for (const turnstile of [
      { success: false },
      { success: true, action: "feedback", hostname: "migratelens.com" },
      { success: true, action: "calculation", hostname: "evil.example" },
    ]) {
      const { request, calls } = setup("calculation", { turnstile });
      equal((await request()).status, 403);
      equal(calls.length, 2);
    }
  },
);
Deno.test(
  "reports unavailable storage or verification without disclosing private detail",
  async () => {
    for (const opts of [{ rpcFailure: true }, { verificationFailure: true }]) {
      const { request } = setup("calculation", opts);
      const response = await request();
      equal(response.status, 503);
      equal((await response.text()).includes("private"), false);
      equal(response.headers.get("Access-Control-Allow-Origin"), origin);
    }
    const { request } = setup("calculation", {
      variables: { ALLOWED_ORIGINS: origin },
    });
    equal((await request()).status, 503);
  },
);
Deno.test(
  "rejects unpublished occupation codes and unknown dataset versions before upstream calls",
  async () => {
    for (const invalidSummary of [
      { ...summary, occupation_code: "999999" },
      { ...summary, snapshot_id: "skillselect-2025-10-31" },
    ]) {
      const { request, calls } = setup();
      equal(
        (
          await request({
            submission: { ...calculation, summary: invalidSummary },
            turnstile_token: "token",
          })
        ).status,
        400,
      );
      equal(calls.length, 0);
      const report = setup("feedback");
      equal(
        (
          await report.request({
            submission: { ...feedback, summary: invalidSummary },
            turnstile_token: "token",
          })
        ).status,
        400,
      );
      equal(report.calls.length, 0);
    }
  },
);
