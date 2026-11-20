/** Explicit local/staging smoke test. Never prints credentials or response bodies. */
const base = Deno.env.get("SUPABASE_URL");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const authenticatedJwt = Deno.env.get("SUPABASE_AUTHENTICATED_JWT");
if (!base || !anonKey || !authenticatedJwt) {
  throw new Error(
    "Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_AUTHENTICATED_JWT for an isolated local/staging project.",
  );
}
const id = crypto.randomUUID();
const summary = {
  occupation_code: "261313",
  age_band: "25-32",
  location: "offshore",
  base_points: 75,
  points_190: 80,
  points_491: 90,
  snapshot_id: "skillselect-2026-10-31",
};
for (const [role, token] of [
  ["anon", anonKey],
  ["authenticated", authenticatedJwt],
]) {
  for (const [table, payload] of [
    [
      "calculation_submissions",
      {
        id,
        email: "permission-test@example.com",
        summary,
        privacy_version: "2026-11-20",
      },
    ],
    [
      "feedback_submissions",
      {
        id,
        category: "bug",
        message: "Permission smoke test fixture.",
        email: null,
        summary: null,
        privacy_version: "2026-11-20",
      },
    ],
  ] as const) {
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
      const result = await fetch(`${base}/rest/v1/${table}?id=eq.${id}`, {
        method,
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body:
          method === "POST"
            ? JSON.stringify(payload)
            : method === "PATCH"
              ? JSON.stringify({ email: "permission-test@example.com" })
              : undefined,
        signal: AbortSignal.timeout(15_000),
      });
      await result.body?.cancel();
      if (![401, 403].includes(result.status))
        throw new Error(
          `${role} ${method} ${table} was not permission-denied (HTTP ${result.status}); remove smoke fixtures using the private SQL Editor.`,
        );
    }
  }
  for (const name of [
    "submit_calculation",
    "submit_feedback",
    "purge_expired_submissions",
  ]) {
    const result = await fetch(`${base}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        name === "purge_expired_submissions"
          ? {}
          : { p_submission: {}, p_write: false },
      ),
      signal: AbortSignal.timeout(15_000),
    });
    await result.body?.cancel();
    if (![401, 403, 404].includes(result.status))
      throw new Error(
        `${role} ${name} was not permission-denied (HTTP ${result.status}).`,
      );
  }
  console.log(`PASS: ${role} direct REST table operations and RPC are denied`);
}
