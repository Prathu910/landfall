// Issued reports, by their link token: reading one (report-get) and
// correcting one (report-revise). The token travels only in a POST body
// and is looked up by its SHA-256.

import {
  validateRevise,
  validToken,
} from "../../../../src/lib/orders/contract.ts";
import { record } from "../../../../src/lib/submissions/contract.ts";
import { readJson } from "../http.ts";
import { issuePayload, parseProfile } from "../report-engine.js";
import { encryptToken, sha256Hex } from "./crypto.ts";
import { rebuildEngineData } from "./data.ts";
import { database } from "./db.ts";
import { browserEndpoint, type Deps, fail, ok, setting } from "./endpoint.ts";
import { pendingMeta } from "./issue.ts";

const READS_PER_MINUTE = 30;

type ByToken =
  | { status: "issued"; payload: unknown; profile: unknown }
  | { status: "revoked" | "expired" | "missing" };

/** The caller's address as Supabase's gateway forwards it. */
function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0].trim() || "unknown";
}

/**
 * POST report-get {token}. A found and an unknown token take the same path
 * (rate check, hash, one lookup); only the answer differs.
 */
export function getHandler(deps: Deps) {
  return browserEndpoint("POST", deps, async (request) => {
    const body = await readJson(request);
    const rpc = database(deps);
    const allowed = await rpc<boolean>("report_rate", {
      p_key: `report-get:${clientAddress(request)}`,
      p_limit: READS_PER_MINUTE,
    });
    if (!allowed) return fail("limited");
    if (!record(body) || !validToken(body.token)) return fail("invalid");
    const found = await rpc<ByToken>("report_by_token", {
      p_token_hash: await sha256Hex(body.token),
    });
    if (found.status === "issued")
      return ok({
        kind: "report",
        payload: found.payload,
        profile: found.profile,
      });
    if (found.status === "missing") return ok({ kind: "not-found" });
    return ok({ kind: found.status });
  });
}

type ReviseSource =
  | {
      status: "open";
      version: number;
      profile: { occupation?: unknown };
      engine_data: unknown;
    }
  | { status: "closed" | "limit" | "missing" };

type Revised =
  | { status: "revised"; version: number }
  | { status: "closed" | "limit" | "occupation-changed" | "missing" };

/** An unknown token (`missing`) reads as invalid: the contract has no not-found here. */
function reviseFailure(status: string) {
  return fail(status === "missing" ? "invalid" : status);
}

/**
 * POST report-revise {token, profile}: within 7 days and 3 revisions, the
 * corrected answers are rebuilt on version 1's data as the next version.
 * The SQL then queues a new PDF and the revised email.
 */
export function reviseHandler(deps: Deps) {
  return browserEndpoint("POST", deps, async (request) => {
    const revise = validateRevise(await readJson(request));
    if (!revise) return fail("invalid");
    const profile = parseProfile(revise.profile);
    if (!profile) return fail("invalid");
    const rpc = database(deps);
    const tokenHash = await sha256Hex(revise.token);
    const source = await rpc<ReviseSource>("report_revise_source", {
      p_token_hash: tokenHash,
    });
    if (source.status !== "open") return reviseFailure(source.status);
    // A different occupation is a different report, not a correction.
    if (profile.occupation !== source.profile.occupation)
      return fail("occupation-changed");
    const rebuilt = await rebuildEngineData(
      setting(deps, "REPORT_SITE_URL"),
      source.engine_data,
      deps.fetch,
    );
    if (!rebuilt) throw new Error("Stored engine data unreadable");
    const now = deps.now();
    const payload = issuePayload(
      rebuilt.data,
      profile,
      new Date(now).toISOString().slice(0, 10),
      pendingMeta(now, source.version + 1),
    );
    const revised = await rpc<Revised>("report_revise", {
      p: {
        token_hash: tokenHash,
        payload,
        profile,
        // Delivery clears token_enc once done; the new PDF needs it again.
        token_enc: await encryptToken(
          revise.token,
          setting(deps, "REPORT_TOKEN_KEY"),
        ),
      },
    });
    if (revised.status === "revised")
      return ok({ kind: "revised", version: revised.version });
    return reviseFailure(revised.status);
  });
}
