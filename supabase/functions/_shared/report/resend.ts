// Resend: one transactional email, with an optional PDF attachment. It
// never throws, and its result carries no request detail, so a report link
// or key can't reach a log through it.

const EMAILS_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 15_000;
const CHUNK = 0x8000;

/** Base64 in chunks, so a large PDF doesn't overflow the argument list. */
export function base64(bytes: Uint8Array): string {
  let binary = "";
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return btoa(binary);
}

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment?: { filename: string; content: Uint8Array };
  /** Sent as Resend's Idempotency-Key, so a retried send isn't delivered twice. */
  idempotencyKey?: string;
};

/** 429 and 5xx (and network failures) are worth retrying; other 4xx are not. */
export async function sendEmail(
  cfg: { apiKey: string; from: string },
  msg: EmailMessage,
  fetcher: typeof fetch,
): Promise<{ ok: true; id: string } | { ok: false; retry: boolean }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.apiKey}`,
    "Content-Type": "application/json",
  };
  if (msg.idempotencyKey) headers["Idempotency-Key"] = msg.idempotencyKey;
  const body: Record<string, unknown> = {
    from: cfg.from,
    to: [msg.to],
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  };
  if (msg.attachment)
    body.attachments = [
      {
        filename: msg.attachment.filename,
        content: base64(msg.attachment.content),
      },
    ];
  let result: Response;
  try {
    result = await fetcher(EMAILS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, retry: true };
  }
  if (!result.ok) {
    await result.body?.cancel();
    return {
      ok: false,
      retry: result.status === 429 || result.status >= 500,
    };
  }
  // Accepted: never resend, even if the reply can't be read.
  try {
    const value: unknown = await result.json();
    const id =
      value && typeof value === "object" && "id" in value ? value.id : "";
    return { ok: true, id: typeof id === "string" ? id : "" };
  } catch {
    return { ok: true, id: "" };
  }
}
