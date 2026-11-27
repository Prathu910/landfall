// Cloudflare Browser Rendering's PDF endpoint renders the report page (its
// print layout) to a PDF. The request shape follows the REST API's /pdf
// endpoint (https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/);
// confirm against https://developers.cloudflare.com/browser-rendering/ before go-live.
// It never throws and returns no request detail: the URL carries the link
// token after "#", which must not reach a log.

// The page gets 30 s to load; the render itself needs a little more.
const TIMEOUT_MS = 60_000;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function isPdf(bytes: Uint8Array): boolean {
  return PDF_MAGIC.every((byte, index) => bytes[index] === byte);
}

/** 429 (the free plan's daily browser time is spent) is `limited`; anything else is `failed`. */
export async function renderPdf(
  cfg: { accountId: string; token: string },
  url: string,
  fetcher: typeof fetch,
): Promise<
  { ok: true; pdf: Uint8Array } | { ok: false; reason: "limited" | "failed" }
> {
  let result: Response;
  try {
    result = await fetcher(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfg.accountId)}/browser-rendering/pdf`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
          pdfOptions: {
            format: "a4",
            printBackground: true,
            preferCSSPageSize: true,
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch {
    return { ok: false, reason: "failed" };
  }
  const type = result.headers
    .get("Content-Type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (!result.ok || type !== "application/pdf") {
    await result.body?.cancel();
    return { ok: false, reason: result.status === 429 ? "limited" : "failed" };
  }
  try {
    const pdf = new Uint8Array(await result.arrayBuffer());
    return isPdf(pdf) ? { ok: true, pdf } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
