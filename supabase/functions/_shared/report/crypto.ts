// Link tokens, codes and the token's encrypted copy (plan 2 ruling R3).
// Only sha256(token) identifies a report; token_enc (AES-GCM 256 under
// REPORT_TOKEN_KEY) lets the delivery job rebuild the link for the PDF and
// the email. Error messages never carry a token or a key.

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(text: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error("Not base64url");
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** 32 random bytes as base64url (43 characters), and the hash we store. */
export async function newToken(
  randomBytes: (n: number) => Uint8Array,
): Promise<{ token: string; hash: string }> {
  const token = base64url(randomBytes(32));
  return { token, hash: await sha256Hex(token) };
}

/** Largest multiple of a million under 2^32: draws at or above it are redrawn. */
const CODE_CEILING = 4_294_000_000;

/** A uniform 6-digit code, "000000" to "999999". */
export function sixDigitCode(randomBytes: (n: number) => Uint8Array): string {
  for (;;) {
    const bytes = randomBytes(4);
    const value =
      ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    if (value < CODE_CEILING) return String(value % 1_000_000).padStart(6, "0");
  }
}

async function tokenKey(keyB64: string): Promise<CryptoKey> {
  let raw: Uint8Array<ArrayBuffer>;
  try {
    raw = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  } catch {
    raw = new Uint8Array();
  }
  if (raw.length !== 32)
    throw new Error("REPORT_TOKEN_KEY must be 32 bytes, base64");
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** "iv.ciphertext", both base64url; a fresh 12-byte IV every time. */
export async function encryptToken(
  token: string,
  keyB64: string,
): Promise<string> {
  const key = await tokenKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(token),
  );
  return `${base64url(iv)}.${base64url(new Uint8Array(sealed))}`;
}

export async function decryptToken(
  sealed: string,
  keyB64: string,
): Promise<string> {
  const key = await tokenKey(keyB64);
  try {
    const [iv, body, extra] = sealed.split(".");
    if (!iv || !body || extra !== undefined) throw new Error("shape");
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64url(iv) },
      key,
      fromBase64url(body),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(plain);
  } catch {
    throw new Error("The stored token could not be decrypted");
  }
}
