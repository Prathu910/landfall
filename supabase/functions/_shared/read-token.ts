// Short-lived read tokens (spec 7): submit-calculation, which already passed
// Turnstile, signs one; write-read accepts it for up to 3 reads. No storage:
// the token carries its own submission id and expiry under an HMAC.

export const READ_TOKEN_TTL_MS = 10 * 60 * 1000;

const SUBMISSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EXPIRY = /^\d{1,15}$/;
const SIGNATURE = /^[A-Za-z0-9_-]{43}$/;

function base64url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64url(signed);
}

/** Compares every character so the time taken doesn't reveal how much matched. */
export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function signReadToken(
  submissionId: string,
  expiresAt: number,
  secret: string,
): Promise<string> {
  const payload = `${submissionId}.${expiresAt}`;
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifyReadToken(
  token: string,
  now: number,
  secret: string,
): Promise<{ ok: true; submissionId: string } | { ok: false }> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false };
  const [submissionId, expiry, provided] = parts;
  if (
    !SUBMISSION_ID.test(submissionId) ||
    !EXPIRY.test(expiry) ||
    !SIGNATURE.test(provided)
  )
    return { ok: false };
  const expiresAt = Number(expiry);
  // A token can't outlive its TTL even if its expiry was signed far ahead.
  if (expiresAt <= now || expiresAt - now > READ_TOKEN_TTL_MS)
    return { ok: false };
  const expected = await signature(`${submissionId}.${expiry}`, secret);
  if (!constantTimeEqual(provided, expected)) return { ok: false };
  return { ok: true, submissionId };
}
