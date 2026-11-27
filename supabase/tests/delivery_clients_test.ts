import { renderPdf } from "../functions/_shared/report/pdf.ts";
import { sendEmail } from "../functions/_shared/report/resend.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

type Call = { url: string; init: RequestInit | undefined };
function recorder(reply: () => Response | Promise<Response>) {
  const calls: Call[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return await reply();
  };
  return { calls, fetcher };
}

const TOKEN = "A".repeat(42) + "_";
const REPORT_URL = `https://migratelens.com/report/#${TOKEN}`;
const EMAIL = {
  apiKey: "re_test_KEY",
  from: "MigrateLens <report@migratelens.com>",
};
const MESSAGE = {
  to: "buyer@example.com",
  subject: "Your MigrateLens PR report ML-2611-0007",
  html: `<p><a href="${REPORT_URL}">Read</a></p>`,
  text: `Read: ${REPORT_URL}`,
};
const CLOUDFLARE = { accountId: "acct123", token: "cf_test_TOKEN" };
const PDF_BYTES = new TextEncoder().encode("%PDF-1.7\n%test\n");

Deno.test(
  "sendEmail posts the message to Resend with the API key",
  async () => {
    const { calls, fetcher } = recorder(() => Response.json({ id: "email_1" }));
    equal(await sendEmail(EMAIL, MESSAGE, fetcher), {
      ok: true,
      id: "email_1",
    });
    equal(calls.length, 1);
    equal(calls[0].url, "https://api.resend.com/emails");
    equal(calls[0].init?.method, "POST");
    const headers = new Headers(calls[0].init?.headers);
    equal(headers.get("Authorization"), "Bearer re_test_KEY");
    equal(headers.get("Content-Type"), "application/json");
    equal(headers.has("Idempotency-Key"), false);
    equal(JSON.parse(String(calls[0].init?.body)), {
      from: EMAIL.from,
      to: ["buyer@example.com"],
      subject: MESSAGE.subject,
      html: MESSAGE.html,
      text: MESSAGE.text,
    });
    equal(calls[0].init?.signal instanceof AbortSignal, true);
  },
);

Deno.test("sendEmail base64-encodes the attachment", async () => {
  const { calls, fetcher } = recorder(() => Response.json({ id: "email_2" }));
  await sendEmail(
    EMAIL,
    {
      ...MESSAGE,
      attachment: { filename: "ML-2611-0007.pdf", content: PDF_BYTES },
      idempotencyKey: "report-1-link-v1",
    },
    fetcher,
  );
  const body = JSON.parse(String(calls[0].init?.body));
  equal(body.attachments, [
    { filename: "ML-2611-0007.pdf", content: "JVBERi0xLjcKJXRlc3QK" },
  ]);
  equal(
    new Headers(calls[0].init?.headers).get("Idempotency-Key"),
    "report-1-link-v1",
  );
});

Deno.test("sendEmail encodes a large attachment without loss", async () => {
  const large = new Uint8Array(300_000).map((_, i) => (i * 31) % 256);
  const { calls, fetcher } = recorder(() => Response.json({ id: "email_3" }));
  await sendEmail(
    EMAIL,
    { ...MESSAGE, attachment: { filename: "big.pdf", content: large } },
    fetcher,
  );
  const encoded: string = JSON.parse(String(calls[0].init?.body)).attachments[0]
    .content;
  const decoded = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  equal(decoded.length, large.length);
  equal(
    decoded.every((byte, i) => byte === large[i]),
    true,
  );
});

Deno.test(
  "sendEmail retries 429, 5xx and network failures, not other 4xx",
  async () => {
    for (const [status, retry] of [
      [429, true],
      [500, true],
      [503, true],
      [400, false],
      [403, false],
      [422, false],
    ] as const) {
      const { fetcher } = recorder(
        () => new Response(`{"message":"no ${REPORT_URL}"}`, { status }),
      );
      equal(await sendEmail(EMAIL, MESSAGE, fetcher), { ok: false, retry });
    }
    const thrower: typeof fetch = () =>
      Promise.reject(new Error(`network down ${REPORT_URL} ${EMAIL.apiKey}`));
    equal(await sendEmail(EMAIL, MESSAGE, thrower), { ok: false, retry: true });
  },
);

Deno.test(
  "renderPdf posts the report URL with the agreed options",
  async () => {
    const { calls, fetcher } = recorder(
      () =>
        new Response(PDF_BYTES, {
          headers: { "Content-Type": "application/pdf" },
        }),
    );
    const result = await renderPdf(CLOUDFLARE, REPORT_URL, fetcher);
    equal(result.ok, true);
    if (result.ok) equal(Array.from(result.pdf), Array.from(PDF_BYTES));
    equal(
      calls[0].url,
      "https://api.cloudflare.com/client/v4/accounts/acct123/browser-rendering/pdf",
    );
    equal(calls[0].init?.method, "POST");
    const headers = new Headers(calls[0].init?.headers);
    equal(headers.get("Authorization"), "Bearer cf_test_TOKEN");
    equal(headers.get("Content-Type"), "application/json");
    equal(JSON.parse(String(calls[0].init?.body)), {
      url: REPORT_URL,
      gotoOptions: { waitUntil: "networkidle0", timeout: 30000 },
      pdfOptions: {
        format: "a4",
        printBackground: true,
        preferCSSPageSize: true,
      },
    });
    equal(calls[0].init?.signal instanceof AbortSignal, true);
  },
);

Deno.test("renderPdf: 429 is limited, other failures are failed", async () => {
  const cases: [() => Response, string][] = [
    [() => new Response("rate limited", { status: 429 }), "limited"],
    [() => new Response("oops", { status: 500 }), "failed"],
    [() => new Response("no", { status: 401 }), "failed"],
    [
      () =>
        Response.json({ success: false, errors: [{ message: REPORT_URL }] }),
      "failed",
    ],
    [
      () =>
        new Response("<html>not a pdf</html>", {
          headers: { "Content-Type": "application/pdf" },
        }),
      "failed",
    ],
  ];
  for (const [reply, reason] of cases) {
    const { fetcher } = recorder(reply);
    equal(await renderPdf(CLOUDFLARE, REPORT_URL, fetcher), {
      ok: false,
      reason,
    });
  }
});

Deno.test(
  "neither client throws or returns the report URL or a secret",
  async () => {
    const thrower: typeof fetch = () =>
      Promise.reject(
        new Error(`cannot load ${REPORT_URL} with ${CLOUDFLARE.token}`),
      );
    for (const run of [
      () => renderPdf(CLOUDFLARE, REPORT_URL, thrower),
      () => sendEmail(EMAIL, MESSAGE, thrower),
    ]) {
      let thrown: unknown = null;
      let result: unknown = null;
      try {
        result = await run();
      } catch (error) {
        thrown = error;
      }
      equal(thrown, null);
      const text = JSON.stringify(result);
      for (const secret of [TOKEN, CLOUDFLARE.token, EMAIL.apiKey]) {
        equal(text.includes(secret), false);
      }
    }
  },
);
