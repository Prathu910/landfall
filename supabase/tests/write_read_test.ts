import { requestParams } from "../functions/_shared/anthropic-complete.ts";
import {
  PRUNE_AT,
  READ_MODELS,
  READ_SYSTEM_PROMPT,
  ReadTimeoutError,
  createReadHandler,
  readConfig,
  signReadToken,
  verifyReadToken,
  type Complete,
} from "../functions/_shared/read.ts";
import { checkRead } from "../../src/lib/outlook/read-contract.ts";
import type { ReportFacts } from "../../src/lib/outlook/read-contract.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
const origin = "https://migratelens.com";
const submissionId = "c5fa65d5-f388-4a7b-940c-1b5b78c751bd";
const secret = "test-read-token-secret";
const start = Date.UTC(2026, 10, 22, 9, 0, 0);
const tenMinutes = 10 * 60 * 1000;
const env: Record<string, string> = {
  ALLOWED_ORIGINS: origin,
  READ_ENABLED: "true",
  ANTHROPIC_API_KEY: "test-anthropic-key",
  READ_TOKEN_SECRET: secret,
};
const facts: ReportFacts = {
  occupation: "Registered Nurses nec",
  dataMonth: "October 2026",
  situation: "189",
  lodged: false,
  stamp: { visa: "189", state: null, label: "Competitive" },
  visas: [
    {
      visa: "189",
      label: "Competitive",
      state: null,
      points: 70,
      caption: "Competitive at your points.",
    },
    {
      visa: "190",
      label: "Competitive",
      state: "New South Wales",
      points: 75,
      caption: "New South Wales invited at or below your points.",
    },
  ],
  counts: [{ name: "invited", text: "168", numbers: [168] }],
  route: ["Keep your EOI in"],
  wait: "Uncertain.",
  changes: [
    {
      title: "Superior English",
      fromPoints: 70,
      toPoints: 80,
      toLabel: "Very strong",
      month: null,
    },
  ],
  extraNumbers: [10, 6, 85],
};
const goodRead =
  "You sit at 70 points for the 189, which is competitive for Registered Nurses nec. Your fastest win is English. A Superior score adds 10 points and puts you at 80, enough for every one of the last 6 rounds. It also lifts your New South Wales 190 score to 85. In October 2026, New South Wales invited 168 nurses at or below your points. The wait is uncertain, so keep your EOI current and check each round.";

function setup(
  opts: {
    variables?: Record<string, string>;
    complete?: Complete;
  } = {},
) {
  let clock = start;
  const calls: { system: string; facts: ReportFacts; model: string }[] = [];
  const complete: Complete = async (system, sentFacts, config) => {
    calls.push({ system, facts: sentFacts, model: config.model });
    return opts.complete
      ? await opts.complete(system, sentFacts, config)
      : goodRead;
  };
  const handler = createReadHandler({
    env: (name) => (opts.variables ?? env)[name],
    complete,
    now: () => clock,
  });
  function advance(ms: number) {
    clock += ms;
  }
  function request(body: unknown, init: RequestInit = {}) {
    return handler(
      new Request("https://project.supabase.co/functions/v1/write-read", {
        method: "POST",
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          "X-Forwarded-For": "203.0.113.7",
        },
        body: JSON.stringify(body),
        ...init,
      }),
    );
  }
  return { handler, request, calls, advance };
}
async function token(expiresAt = start + tenMinutes) {
  return await signReadToken(submissionId, expiresAt, secret);
}
async function silenced<T>(run: (logged: string[]) => Promise<T>): Promise<T> {
  const original = console.error;
  const logged: string[] = [];
  console.error = (...values: unknown[]) => {
    logged.push(values.map(String).join(" "));
  };
  try {
    return await run(logged);
  } finally {
    console.error = original;
  }
}

Deno.test("the fixture read passes the shared checkRead", () => {
  equal(checkRead(goodRead, facts), { ok: true });
});
Deno.test("keeps an allowlist of current model IDs", () => {
  equal(READ_MODELS, [
    "claude-opus-5-5",
    "claude-sonnet-5-5",
    "claude-haiku-5-5",
    "claude-fable-5-2",
  ]);
});
Deno.test(
  "readConfig defaults to Opus 5.5 with a 2000-token cap when enabled",
  () => {
    equal(
      readConfig((name) => env[name]),
      {
        enabled: true,
        apiKey: "test-anthropic-key",
        model: "claude-opus-5-5",
        maxTokens: 2000,
        tokenSecret: secret,
      },
    );
    const sonnet = readConfig(
      (name) =>
        ({
          ...env,
          READ_MODEL: "claude-sonnet-5-5",
          READ_MAX_OUTPUT_TOKENS: "3000",
        })[name],
    );
    equal(sonnet.enabled && [sonnet.model, sonnet.maxTokens], [
      "claude-sonnet-5-5",
      3000,
    ]);
  },
);
Deno.test(
  "readConfig is disabled unless every switch and setting is valid",
  () => {
    const variants: Record<string, string | undefined>[] = [
      { READ_ENABLED: undefined },
      { READ_ENABLED: "TRUE" },
      { READ_ENABLED: "false" },
      { ANTHROPIC_API_KEY: undefined },
      { ANTHROPIC_API_KEY: " " },
      { READ_TOKEN_SECRET: undefined },
      { READ_MODEL: "claude-opus-55" },
      { READ_MODEL: "gpt-5" },
      { READ_MAX_OUTPUT_TOKENS: "0" },
      { READ_MAX_OUTPUT_TOKENS: "12.5" },
      { READ_MAX_OUTPUT_TOKENS: "lots" },
      { READ_MAX_OUTPUT_TOKENS: "64000" },
    ];
    for (const variant of variants) {
      const config = readConfig((name) =>
        Object.hasOwn(variant, name) ? variant[name] : env[name],
      );
      equal(config.enabled, false);
      if (!config.enabled) equal(typeof config.reason, "string");
    }
  },
);
Deno.test(
  "answers disabled when READ_ENABLED is unset, without calling the model",
  async () => {
    const { request, calls } = setup({
      variables: { ...env, READ_ENABLED: "" },
    });
    const response = await request({ token: await token(), facts });
    equal(response.status, 200);
    equal(await response.json(), { read: null, reason: "disabled" });
    equal(calls.length, 0);
  },
);
Deno.test(
  "a misspelt READ_MODEL never reaches the API and logs only the reason",
  async () => {
    await silenced(async (logged) => {
      const { request, calls } = setup({
        variables: { ...env, READ_MODEL: "claude-opus-55" },
      });
      const response = await request({ token: await token(), facts });
      equal(response.status, 200);
      equal(await response.json(), { read: null, reason: "disabled" });
      equal(calls.length, 0);
      equal(logged.length, 1);
      equal(logged[0].includes("READ_MODEL"), true);
      equal(logged[0].includes("Nurses"), false);
      equal(logged[0].includes(secret), false);
    });
  },
);
Deno.test(
  "a valid token returns the model's read, written from the facts only",
  async () => {
    const { request, calls } = setup();
    const response = await request({ token: await token(), facts });
    equal(response.status, 200);
    equal(await response.json(), { read: goodRead });
    equal(calls.length, 1);
    equal(calls[0].system, READ_SYSTEM_PROMPT);
    equal(calls[0].facts, facts);
    equal(calls[0].model, "claude-opus-5-5");
    equal(response.headers.get("Access-Control-Allow-Origin"), origin);
    equal(response.headers.get("Cache-Control"), "no-store");
  },
);
Deno.test("rejects an expired token", async () => {
  const { request, calls, advance } = setup();
  const issued = await token();
  advance(tenMinutes + 1);
  equal((await request({ token: issued, facts })).status, 403);
  equal(calls.length, 0);
});
Deno.test("allows three reads per token and rejects the fourth", async () => {
  const { request, calls } = setup();
  const issued = await token();
  for (let use = 0; use < 3; use++) {
    equal((await request({ token: issued, facts })).status, 200);
  }
  equal((await request({ token: issued, facts })).status, 403);
  equal(calls.length, 3);
});
Deno.test(
  "rejects missing, malformed, tampered and foreign tokens",
  async () => {
    const issued = await token();
    const [id, expiry, signature] = issued.split(".");
    const foreign = await signReadToken(
      submissionId,
      start + tenMinutes,
      "another-secret",
    );
    const tooLong = await signReadToken(
      submissionId,
      start + 2 * tenMinutes,
      secret,
    );
    for (const bad of [
      undefined,
      "",
      "not-a-token",
      `${id}.${expiry}`,
      `${id}.${Number(expiry) + 60_000}.${signature}`,
      `${id.replace("c", "d")}.${expiry}.${signature}`,
      `${id}.${expiry}.${signature.slice(0, -2)}`,
      foreign,
      tooLong,
    ]) {
      const { request, calls } = setup();
      equal((await request({ token: bad, facts })).status, 403);
      equal(calls.length, 0);
    }
  },
);
Deno.test("verifyReadToken returns the submission id", async () => {
  equal(await verifyReadToken(await token(), start, secret), {
    ok: true,
    submissionId,
  });
  equal(await verifyReadToken(await token(), start + tenMinutes, secret), {
    ok: false,
  });
});
Deno.test(
  "a read with a number that isn't in the facts is not returned",
  async () => {
    const { request } = setup({
      complete: async () => goodRead.replace("168 nurses", "999 nurses"),
    });
    const response = await request({ token: await token(), facts });
    equal(response.status, 200);
    equal(await response.json(), { read: null, reason: "check-failed" });
  },
);
Deno.test("a refusal answers refused", async () => {
  const { request } = setup({ complete: async () => null });
  equal(await (await request({ token: await token(), facts })).json(), {
    read: null,
    reason: "refused",
  });
});
Deno.test("a model timeout answers timeout", async () => {
  const { request } = setup({
    complete: async () => {
      throw new ReadTimeoutError();
    },
  });
  equal(await (await request({ token: await token(), facts })).json(), {
    read: null,
    reason: "timeout",
  });
});
Deno.test(
  "other model failures answer 503 without private detail",
  async () => {
    const { request } = setup({
      complete: async () => {
        throw new Error("private upstream detail");
      },
    });
    const issued = await token();
    const response = await silenced(() => request({ token: issued, facts }));
    equal(response.status, 503);
    equal((await response.text()).includes("private"), false);
  },
);
Deno.test(
  "a 503 logs the error class and HTTP status, never the message",
  async () => {
    class OverloadedError extends Error {
      status = 529;
    }
    const { request } = setup({
      complete: async () => {
        throw new OverloadedError("private upstream detail");
      },
    });
    const logged = await silenced(async (lines) => {
      const response = await request({ token: await token(), facts });
      equal(response.status, 503);
      return lines;
    });
    equal(logged, ["write-read failed: OverloadedError (HTTP 529)"]);
  },
);
Deno.test("a 503 without an HTTP status logs the class only", async () => {
  const { request } = setup({
    complete: async () => {
      throw new TypeError("private upstream detail");
    },
  });
  const logged = await silenced(async (lines) => {
    await request({ token: await token(), facts });
    return lines;
  });
  equal(logged, ["write-read failed: TypeError"]);
});
Deno.test("rejects invalid facts before calling the model", async () => {
  const issued = await token();
  const withoutStamp: Record<string, unknown> = { ...facts };
  delete withoutStamp.stamp;
  for (const bad of [
    null,
    "facts",
    withoutStamp,
    { ...facts, name: "Priya" },
    { ...facts, email: "priya@example.com" },
    { ...facts, situation: "491" },
    { ...facts, lodged: "no" },
    { ...facts, visas: [{ ...facts.visas[0], points: "70" }] },
    { ...facts, visas: [{ ...facts.visas[0], dob: "1990-01-01" }] },
    { ...facts, counts: [{ name: "tied", text: "1,841", numbers: [NaN] }] },
    { ...facts, route: [7] },
    { ...facts, changes: [{ ...facts.changes[0], month: 202611 }] },
    { ...facts, extraNumbers: ["10"] },
    { ...facts, occupation: "x".repeat(2000) },
  ]) {
    const { request, calls } = setup();
    equal((await request({ token: issued, facts: bad })).status, 400);
    equal(calls.length, 0);
  }
  const { request } = setup();
  equal((await request({ token: issued, facts, extra: true })).status, 400);
});
Deno.test("invalid facts do not use up one of the token's reads", async () => {
  const { request, calls } = setup();
  const issued = await token();
  for (let attempt = 0; attempt < 3; attempt++) {
    await request({ token: issued, facts: { ...facts, lodged: "no" } });
  }
  equal((await request({ token: issued, facts })).status, 200);
  equal(calls.length, 1);
});
Deno.test("rejects other origins without CORS headers", async () => {
  for (const badOrigin of ["https://evil.example", ""]) {
    const { request, calls } = setup();
    const response = await request(
      { token: await token(), facts },
      {
        headers: { Origin: badOrigin, "Content-Type": "application/json" },
      },
    );
    equal(response.status, 403);
    equal(response.headers.get("Access-Control-Allow-Origin"), null);
    equal(calls.length, 0);
  }
});
Deno.test("handles preflight and rejects other methods", async () => {
  const { handler } = setup();
  const preflight = await handler(
    new Request("https://project.supabase.co/functions/v1/write-read", {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    }),
  );
  equal(preflight.status, 204);
  const get = await handler(
    new Request("https://project.supabase.co/functions/v1/write-read", {
      method: "GET",
      headers: { Origin: origin },
    }),
  );
  equal(get.status, 405);
});
Deno.test(
  "rate limits each IP address within a one-minute window",
  async () => {
    const { request, advance } = setup({
      variables: { ...env, READ_ENABLED: "false" },
    });
    const issued = await token();
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt++) {
      statuses.push((await request({ token: issued, facts })).status);
    }
    equal(
      statuses.slice(0, 10).every((status) => status === 200),
      true,
    );
    equal(statuses[10], 429);
    const other = await request(
      { token: issued, facts },
      {
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          "X-Forwarded-For": "198.51.100.2",
        },
      },
    );
    equal(other.status, 200);
    advance(60_001);
    equal((await request({ token: issued, facts })).status, 200);
  },
);
Deno.test(
  "the rate-limit map is capped, dropping the oldest addresses first",
  async () => {
    const { request } = setup({
      variables: { ...env, READ_ENABLED: "false" },
    });
    const issued = await token();
    function from(ip: string) {
      return request(
        { token: issued, facts },
        {
          headers: {
            Origin: origin,
            "Content-Type": "application/json",
            "X-Forwarded-For": ip,
          },
        },
      );
    }
    for (let attempt = 0; attempt < 10; attempt++) await from("192.0.2.1");
    equal((await from("192.0.2.1")).status, 429);
    // Fill the map with new addresses inside the same window.
    for (let index = 0; index < PRUNE_AT; index++) {
      await from(`10.0.${Math.floor(index / 256)}.${index % 256}`);
    }
    // The oldest address was evicted, so its count starts again.
    equal((await from("192.0.2.1")).status, 200);
  },
);
Deno.test(
  "requests server-side fallback only for models that support it",
  () => {
    const enabled = readConfig((name) => env[name]);
    if (!enabled.enabled) throw new Error("fixture config should be enabled");
    for (const model of [
      "claude-opus-5-5",
      "claude-sonnet-5-5",
      "claude-fable-5-2",
    ]) {
      equal(requestParams("system", facts, { ...enabled, model }), {
        model,
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: "system",
        messages: [{ role: "user", content: JSON.stringify(facts) }],
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    }
    const haiku = requestParams("system", facts, {
      ...enabled,
      model: "claude-haiku-5-5",
    });
    equal(haiku, {
      model: "claude-haiku-5-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: "system",
      messages: [{ role: "user", content: JSON.stringify(facts) }],
    });
    equal(Object.hasOwn(haiku, "fallbacks"), false);
    equal(Object.hasOwn(haiku, "betas"), false);
  },
);
