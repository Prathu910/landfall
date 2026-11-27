// The paid-report RPCs through PostgREST, as service_role. jsonb functions
// take their argument as `p`; the others name theirs (see the migrations).
// A failure throws a message that names only the function.

import { type Deps, setting } from "./endpoint.ts";

const TIMEOUT_MS = 15_000;

export type Rpc = <T>(
  name: string,
  args?: Record<string, unknown>,
) => Promise<T>;

export function database(deps: Deps): Rpc {
  const base = setting(deps, "SUPABASE_URL").replace(/\/$/, "");
  const key = setting(deps, "SUPABASE_SERVICE_ROLE_KEY");
  return async <T>(name: string, args: Record<string, unknown> = {}) => {
    let result: Response;
    try {
      result = await deps.fetch(`${base}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new Error(`Storage call ${name} failed`);
    }
    if (!result.ok) {
      await result.body?.cancel();
      throw new Error(`Storage call ${name} failed (HTTP ${result.status})`);
    }
    const text = await result.text();
    return (text ? JSON.parse(text) : null) as T;
  };
}
