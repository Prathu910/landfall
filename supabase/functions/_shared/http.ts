// HTTP pieces shared by every public Function: origin allowlist, CORS
// headers, preflight and the streamed body cap.

type Env = (name: string) => string | undefined;
const BODY_LIMIT = 16 * 1024;
export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
/** Exact frontend origins; throws (so callers answer 503) when misconfigured. */
export function allowedOrigins(env: Env): string[] {
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
  return origins;
}
export function response(
  status: number,
  body: unknown,
  origin?: string,
  method: "GET" | "POST" = "POST",
): Response {
  const headers = new Headers({
    Vary: "Origin",
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex",
    "Content-Type": "application/json",
    Allow: `${method}, OPTIONS`,
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  if (status === 204) {
    headers.set("Access-Control-Allow-Methods", `${method}, OPTIONS`);
    headers.set("Access-Control-Allow-Headers", "content-type");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers,
  });
}
export async function readJson(request: Request): Promise<unknown> {
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    throw new RequestError(415, "Send application/json.");
  }
  const text = await readText(request);
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestError(400, "Send valid JSON.");
  }
}
/** The raw body as UTF-8 text, streamed under the cap (the webhook signs it). */
export async function readText(
  request: Request,
  limit = BODY_LIMIT,
): Promise<string> {
  if (Number(request.headers.get("Content-Length")) > limit) {
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
      if (size > limit) {
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
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new RequestError(400, "Send valid JSON.");
  }
}
export function preflight(
  request: Request,
  origin: string,
  allowed: "GET" | "POST" = "POST",
): Response {
  const method = request.headers.get("Access-Control-Request-Method");
  const headers = (request.headers.get("Access-Control-Request-Headers") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (
    (method && method !== allowed) ||
    headers.some((header) => header !== "content-type")
  )
    return response(400, { error: "Unsupported preflight." }, origin, allowed);
  return response(204, null, origin, allowed);
}
