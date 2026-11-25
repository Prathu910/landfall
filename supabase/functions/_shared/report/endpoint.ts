// The paid-report Functions' common shell: dependencies, settings, replies
// and the browser endpoint (origin allowlist, preflight, one method, the
// 16 KB body cap from http.ts). Every unexpected failure answers "busy"
// with no detail, so no token, key or SQL message reaches a response.

import { allowedOrigins, preflight, RequestError, response } from "../http.ts";

export type Deps = {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  now: () => number;
  randomBytes: (n: number) => Uint8Array;
};

/** The deps a deployed Function runs with. */
export function liveDeps(): Deps {
  return {
    env: (name) => Deno.env.get(name),
    fetch,
    now: () => Date.now(),
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  };
}

/** A required setting; a missing one is a server fault (busy), named only in the error. */
export function setting(deps: Deps, name: string): string {
  const value = deps.env(name);
  if (!value) throw new Error(`Missing setting ${name}`);
  return value;
}

export type Reply = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

/** HTTP status per error code; every other contract outcome is 200. */
const STATUS: Record<string, number> = {
  invalid: 400,
  signature: 400,
  verification: 403,
  limited: 429,
  busy: 503,
};

export function ok(body: unknown): Reply {
  return { status: 200, body };
}

export function fail(code: string, extra: Record<string, unknown> = {}): Reply {
  return {
    status: STATUS[code] ?? 200,
    body: { kind: "error", code, ...extra },
  };
}

function send(
  reply: Reply,
  origin: string | undefined,
  method: "GET" | "POST",
) {
  const res = response(reply.status, reply.body, origin, method);
  for (const [name, value] of Object.entries(reply.headers ?? {}))
    res.headers.set(name, value);
  return res;
}

/** A Function the site's pages call: allowed origins only, one method. */
export function browserEndpoint(
  method: "GET" | "POST",
  deps: Deps,
  run: (request: Request, origin: string) => Promise<Reply>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    let origin: string | undefined;
    try {
      const claimed = request.headers.get("Origin");
      if (!claimed || !allowedOrigins(deps.env).includes(claimed))
        return response(
          403,
          { error: "This origin is not allowed." },
          undefined,
          method,
        );
      origin = claimed;
      if (request.method === "OPTIONS")
        return preflight(request, origin, method);
      if (request.method !== method)
        return response(405, { error: `Use ${method}.` }, origin, method);
      return send(await run(request, origin), origin, method);
    } catch (error) {
      if (error instanceof RequestError)
        return send(
          fail(error.status === 403 ? "verification" : "invalid"),
          origin,
          method,
        );
      return send(fail("busy"), origin, method);
    }
  };
}
