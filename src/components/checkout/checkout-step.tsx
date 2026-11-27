"use client";

import { useEffect, useRef } from "react";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import type { CheckoutBeats } from "@/lib/checkout/beats";
import { receiptView, type Reader } from "@/lib/checkout/receipt-view";
import { activeCurrency } from "@/lib/checkout/reducer";
import type { Profile } from "@/lib/migration";
import type { Quote } from "@/lib/orders/contract";
import { checkoutConfig } from "../submissions/config";
import { BuildUp } from "./build-up";
import { Receipt } from "./receipt";
import { ReceiptForm } from "./receipt-form";
import { useCheckout } from "./use-checkout";
import styles from "./checkout-step.module.css";

type Props = {
  profile: Profile;
  asOf: string;
  reader: Reader;
  beats: CheckoutBeats;
  initialQuote: Quote | null;
  onBack: () => void;
  onNoData: () => void;
};

/** /check/'s checkout: the three beats, then the receipt with its ticket. */
export function CheckoutStep(props: Props) {
  const { state, send, turnstileKey, refreshQuote } = useCheckout(props);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const view = receiptView(state, props.reader);
  const locked = state.status !== "ready";
  // Once a payment is in hand the reader stays until it is confirmed.
  const canLeave =
    state.status === "ready" ||
    state.status === "code" ||
    state.status === "issued-by-email" ||
    (state.status === "error" && !state.payment);
  return (
    <section className={styles.step} aria-labelledby="checkout-heading">
      <div className={styles.top}>
        <Button
          variant="subtle"
          color="dark"
          leftSection={<ArrowLeft size={16} aria-hidden />}
          onClick={props.onBack}
          disabled={!canLeave}
        >
          Back to my free result
        </Button>
        <h2
          id="checkout-heading"
          ref={heading}
          tabIndex={-1}
          className={styles.heading}
        >
          Your full PR report
        </h2>
      </div>
      <div className={styles.two}>
        <BuildUp beats={props.beats} />
        <div className={styles.side}>
          <Receipt
            view={view}
            currency={activeCurrency(state)}
            canSwitch={!locked}
            onCurrency={(currency) => send({ type: "currency", currency })}
          >
            <ReceiptForm
              state={state}
              view={view}
              send={send}
              siteKey={checkoutConfig()?.siteKey ?? null}
              turnstileKey={turnstileKey}
              onRetryQuote={refreshQuote}
            />
          </Receipt>
        </div>
      </div>
    </section>
  );
}
