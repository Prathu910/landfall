import {
  createRazorpayOrder,
  hmacHex,
  parseRazorpayEvent,
  RazorpayError,
  validPaymentSignature,
  validWebhookSignature,
} from "../functions/_shared/report/razorpay.ts";
import captured from "./fixtures/razorpay-payment-captured.json" with { type: "json" };
import orderPaid from "./fixtures/razorpay-order-paid.json" with { type: "json" };
import refunded from "./fixtures/razorpay-refund-processed.json" with { type: "json" };

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

// Computed independently with Node's crypto.createHmac("sha256", secret):
// "test_secret" over "order_TEST1|pay_TEST1", and "whsec_test" over
// JSON.stringify(the payment.captured fixture).
const PAYMENT_SIGNATURE =
  "5948cc3c4d71d71d78231ee17c840ec2d39e2f9692ede8d84176db164c33bcdb";
const WEBHOOK_SIGNATURE =
  "90e6cab3c78d2adf97a921084bf872fe388e80216f17a1a1ca594ca839ac5c07";
const KEY = { keyId: "rzp_test_KEY", keySecret: "sk_SECRET_value" };

/** Changes one hex character, keeping it hex. */
function flip(hex: string, at: number): string {
  const next = hex[at] === "0" ? "1" : "0";
  return hex.slice(0, at) + next + hex.slice(at + 1);
}

Deno.test("hmacHex matches an independent HMAC-SHA256", async () => {
  equal(
    await hmacHex("test_secret", "order_TEST1|pay_TEST1"),
    PAYMENT_SIGNATURE,
  );
});

Deno.test(
  "accepts the payment signature and refuses one-character changes",
  async () => {
    equal(
      await validPaymentSignature(
        "order_TEST1",
        "pay_TEST1",
        PAYMENT_SIGNATURE,
        "test_secret",
      ),
      true,
    );
    for (const at of [0, 31, 63]) {
      equal(
        await validPaymentSignature(
          "order_TEST1",
          "pay_TEST1",
          flip(PAYMENT_SIGNATURE, at),
          "test_secret",
        ),
        false,
      );
    }
    equal(
      await validPaymentSignature(
        "order_TEST1",
        "pay_TEST2",
        PAYMENT_SIGNATURE,
        "test_secret",
      ),
      false,
    );
    equal(
      await validPaymentSignature(
        "order_TEST1",
        "pay_TEST1",
        PAYMENT_SIGNATURE,
        "test_secreT",
      ),
      false,
    );
    equal(
      await validPaymentSignature(
        "order_TEST1",
        "pay_TEST1",
        PAYMENT_SIGNATURE.slice(1),
        "test_secret",
      ),
      false,
    );
  },
);

Deno.test("accepts the webhook signature over the raw body only", async () => {
  const body = JSON.stringify(captured);
  equal(
    await validWebhookSignature(body, WEBHOOK_SIGNATURE, "whsec_test"),
    true,
  );
  equal(
    await validWebhookSignature(
      body,
      flip(WEBHOOK_SIGNATURE, 10),
      "whsec_test",
    ),
    false,
  );
  equal(
    await validWebhookSignature(body + " ", WEBHOOK_SIGNATURE, "whsec_test"),
    false,
  );
  equal(
    await validWebhookSignature(
      body.replace("69900", "69901"),
      WEBHOOK_SIGNATURE,
      "whsec_test",
    ),
    false,
  );
  equal(await validWebhookSignature(body, "", "whsec_test"), false);
  equal(await validWebhookSignature(body, WEBHOOK_SIGNATURE, ""), false);
});

Deno.test(
  "createRazorpayOrder sends Basic auth, the body and a timeout",
  async () => {
    const calls: { url: string; init: RequestInit | undefined }[] = [];
    const fetcher: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return Response.json({
        id: "order_TEST1",
        entity: "order",
        amount: 69900,
        currency: "INR",
        status: "created",
      });
    };
    const order = await createRazorpayOrder(
      KEY,
      {
        amount: 69900,
        currency: "INR",
        receipt: "c5fa65d5-f388-4a7b-940c-1b5b78c751bd",
        notes: { occupation: "261313" },
      },
      fetcher,
    );
    equal(order, { id: "order_TEST1", amount: 69900, currency: "INR" });
    equal(calls.length, 1);
    equal(calls[0].url, "https://api.razorpay.com/v1/orders");
    equal(calls[0].init?.method, "POST");
    const headers = new Headers(calls[0].init?.headers);
    equal(
      headers.get("Authorization"),
      "Basic cnpwX3Rlc3RfS0VZOnNrX1NFQ1JFVF92YWx1ZQ==",
    );
    equal(headers.get("Content-Type"), "application/json");
    equal(JSON.parse(String(calls[0].init?.body)), {
      amount: 69900,
      currency: "INR",
      receipt: "c5fa65d5-f388-4a7b-940c-1b5b78c751bd",
      notes: { occupation: "261313" },
    });
    equal(calls[0].init?.signal instanceof AbortSignal, true);
  },
);

Deno.test(
  "createRazorpayOrder throws RazorpayError without the secret",
  async () => {
    const failures: (typeof fetch)[] = [
      async () =>
        Response.json(
          { error: { description: `bad key ${KEY.keySecret}` } },
          { status: 401 },
        ),
      async () => Response.json({ id: 7 }),
      async () => {
        throw new Error(`network down for ${KEY.keySecret}`);
      },
    ];
    for (const fetcher of failures) {
      let caught: unknown = null;
      try {
        await createRazorpayOrder(
          KEY,
          { amount: 69900, currency: "INR", receipt: "r", notes: {} },
          fetcher,
        );
      } catch (error) {
        caught = error;
      }
      equal(caught instanceof RazorpayError, true);
      const text = `${(caught as Error).message} ${(caught as Error).stack} ${JSON.stringify(caught)}`;
      equal(text.includes(KEY.keySecret), false);
      equal(text.includes(btoa(`${KEY.keyId}:${KEY.keySecret}`)), false);
    }
  },
);

Deno.test("parses payment.captured and order.paid into the payment", () => {
  const payment = {
    id: "pay_TEST1",
    order_id: "order_TEST1",
    amount: 69900,
    currency: "INR",
    status: "captured",
  };
  equal(parseRazorpayEvent(captured), { event: "payment.captured", payment });
  equal(parseRazorpayEvent(orderPaid), { event: "order.paid", payment });
});

Deno.test("parses refund.processed into the refunded payment id", () => {
  equal(parseRazorpayEvent(refunded), {
    event: "refund.processed",
    payment: {
      id: "pay_TEST1",
      order_id: "order_TEST1",
      amount: 69900,
      currency: "INR",
      status: "refunded",
    },
    refund: { payment_id: "pay_TEST1" },
  });
});

Deno.test("keeps unknown events and refuses malformed bodies", () => {
  equal(parseRazorpayEvent({ event: "payment.failed", payload: {} }), {
    event: "payment.failed",
  });
  equal(parseRazorpayEvent(null), null);
  equal(parseRazorpayEvent([]), null);
  equal(parseRazorpayEvent({ payload: {} }), null);
  const broken = structuredClone(captured) as Record<string, unknown>;
  (
    broken.payload as { payment: { entity: Record<string, unknown> } }
  ).payment.entity.amount = "69900";
  equal(parseRazorpayEvent(broken), { event: "payment.captured" });
});
