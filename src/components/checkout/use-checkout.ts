"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { defaultCurrency } from "@/lib/checkout/currency";
import { issuedFlagKey } from "@/lib/checkout/issued-flag";
import { BUSY, SCRIPT_FAILED } from "@/lib/checkout/messages";
import {
  activeCurrency,
  checkoutReducer,
  initialCheckout,
  type CheckoutEvent,
  type CheckoutState,
} from "@/lib/checkout/reducer";
import type { Profile } from "@/lib/migration";
import { emailHint, type Quote } from "@/lib/orders/contract";
import { loadRazorpay, openRazorpay } from "./razorpay";
import { getQuote, postConfirm, postOrder, postVerify } from "./transport";

type Options = {
  profile: Profile;
  asOf: string;
  initialQuote: Quote | null;
  onNoData: () => void;
};

type Send = (event: CheckoutEvent) => void;

/** The issued mark carries only the masked email, for "PDF sent to a•••@…". */
async function goToReport(token: string, hint: string) {
  try {
    sessionStorage.setItem(await issuedFlagKey(token), hint);
  } catch {
    /* Without the mark the report simply opens without the issued moment. */
  }
  // A full load on purpose: the report page starts clean, without the
  // checkout's memory or Razorpay's script.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a document load is intended
  window.location.assign(`/report/#${token}`);
}

function failure(send: Send, fallback?: string) {
  return (error: unknown) =>
    send({
      type: "failed",
      message: fallback ?? (error instanceof Error ? error.message : BUSY),
    });
}

/** Starts the request that belongs to the status just entered. */
function start(next: CheckoutState, send: Send, context: Options) {
  const { profile, asOf, onNoData } = context;
  switch (next.status) {
    case "submitting":
      postOrder({
        profile,
        email: next.email,
        currency: activeCurrency(next),
        consent: true,
        asOf,
        turnstile_token: next.turnstile,
      })
        .then((response) => send({ type: "order", response }))
        .catch(failure(send));
      return;
    case "verifying":
      postVerify({ claimId: next.claimId ?? "", code: next.code })
        .then((response) => send({ type: "verify", response }))
        .catch(failure(send));
      return;
    case "paying": {
      const order = next.order;
      if (!order) return;
      loadRazorpay()
        .then((ctor) =>
          openRazorpay(ctor, {
            ...order,
            email: next.email,
            onSuccess: (paymentId, signature) =>
              send({ type: "razorpay-success", paymentId, signature }),
            onDismiss: () => send({ type: "razorpay-dismissed" }),
          }),
        )
        .catch(failure(send, SCRIPT_FAILED));
      return;
    }
    case "confirming":
      if (!next.order || !next.payment) return;
      postConfirm({ orderId: next.order.orderId, ...next.payment })
        .then((response) => send({ type: "confirm", response }))
        .catch(failure(send));
      return;
    case "issued":
      if (next.token)
        void goToReport(next.token, next.emailHint ?? emailHint(next.email));
      return;
    case "error":
      if (next.error?.code === "no-data") onNoData();
      return;
  }
}

/**
 * The checkout's state machine plus its side effects: each request starts on
 * the transition into its status, so the pure reducer stays the only source
 * of truth and a response can only ever land on the state that asked for it.
 */
export function useCheckout({
  profile,
  asOf,
  initialQuote,
  onNoData,
}: Options) {
  const [state, setState] = useState(() =>
    initialCheckout(
      initialQuote,
      defaultCurrency(Intl.DateTimeFormat().resolvedOptions().timeZone, true),
    ),
  );
  // Turnstile tokens are single use: a new widget after every order request.
  const [turnstileKey, setTurnstileKey] = useState(0);
  const current = useRef<CheckoutState>(state);
  const context = useRef<Options>({ profile, asOf, initialQuote, onNoData });
  useEffect(() => {
    context.current = { profile, asOf, initialQuote, onNoData };
  }, [profile, asOf, initialQuote, onNoData]);

  // Responses re-enter through the latest `send`, which a ref holds.
  const relay = useRef<Send>(() => {});
  const send: Send = useCallback((event) => {
    const prev = current.current;
    const next = checkoutReducer(prev, event);
    if (next === prev) return;
    current.current = next;
    setState(next);
    if (prev.status === "submitting" && next.status !== "submitting")
      setTurnstileKey((key) => key + 1);
    if (next.status !== prev.status)
      start(next, (e) => relay.current(e), context.current);
  }, []);
  useEffect(() => {
    relay.current = send;
  }, [send]);

  const refreshQuote = useCallback(() => {
    getQuote()
      .then((quote) => send({ type: "quote", quote }))
      .catch(() => {
        // A quote already shown stays usable; only a missing one is an error.
        if (!current.current.quote) send({ type: "failed", message: BUSY });
      });
  }, [send]);

  // The founding count moves, so the receipt asks again when it opens.
  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  return { state, send, turnstileKey, refreshQuote };
}
