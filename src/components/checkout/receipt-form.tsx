"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { MailCheck } from "lucide-react";
import { checkoutMessage } from "@/lib/checkout/messages";
import type { ReceiptView } from "@/lib/checkout/receipt-view";
import type { CheckoutEvent, CheckoutState } from "@/lib/checkout/reducer";
import { emailHint } from "@/lib/orders/contract";
import { Turnstile } from "../submissions/turnstile";
import { CodeEntry } from "./code-entry";
import { Ticket } from "./ticket";
import styles from "./receipt.module.css";

type Props = {
  state: CheckoutState;
  view: ReceiptView;
  send: (event: CheckoutEvent) => void;
  siteKey: string | null;
  turnstileKey: number;
  onRetryQuote: () => void;
};

const WORKING = new Set(["submitting", "verifying", "paying", "confirming"]);

function Outcome({ state, send }: Pick<Props, "state" | "send">) {
  const message = checkoutMessage(state);
  if (state.status === "issued")
    return (
      <p className={styles.outcome} role="status">
        Your report is issued. Opening it now…
      </p>
    );
  if (state.status === "issued-by-email")
    return (
      <div className={styles.outcome} role="status">
        <MailCheck size={22} aria-hidden />
        <p>
          <b>Your report is issued: check your email</b>
        </p>
        <p>We&apos;ve sent its private link to {emailHint(state.email)}.</p>
      </div>
    );
  return (
    <div className={styles.outcome}>
      <p role="alert">{message}</p>
      {state.error?.code === "confirm-busy" && (
        <button
          type="button"
          className={styles.retry}
          onClick={() => send({ type: "retry" })}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** The receipt's form: email (or code), consent, verification and ticket. */
export function ReceiptForm(props: Props) {
  const { state, view, send } = props;
  const emailId = useId();
  const form = useRef<HTMLFormElement>(null);
  const was = useRef(state.status);
  // A busy ticket is disabled, which drops focus: put it back when the
  // request ends, on the code field or the ticket, for keyboard readers.
  useEffect(() => {
    const before = was.current;
    was.current = state.status;
    if (!WORKING.has(before) || WORKING.has(state.status)) return;
    const target =
      state.status === "code"
        ? form.current?.querySelector<HTMLElement>("input[inputmode=numeric]")
        : form.current?.querySelector<HTMLElement>("button[type=submit]");
    target?.focus();
  }, [state.status]);
  if (
    state.status === "issued" ||
    state.status === "issued-by-email" ||
    state.status === "error"
  )
    return <Outcome state={state} send={send} />;
  const busy = WORKING.has(state.status);
  const coding = state.status === "code" || state.status === "verifying";
  const message = checkoutMessage(state);
  const quoteMissing = view.kind === "pending";
  return (
    <form
      ref={form}
      className={styles.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        send({ type: "submit" });
      }}
    >
      {coding ? (
        <CodeEntry
          hint={state.emailHint ?? emailHint(state.email)}
          code={state.code}
          claimId={state.claimId ?? ""}
          busy={busy}
          onCode={(code) => send({ type: "code", code })}
          onResend={() => send({ type: "resend" })}
          onChangeEmail={() => send({ type: "change-email" })}
        />
      ) : (
        <div>
          <label className={styles.label} htmlFor={emailId}>
            Where should we send your report?
          </label>
          <input
            id={emailId}
            className={styles.input}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={state.email}
            disabled={busy}
            onChange={(event) =>
              send({ type: "email", email: event.currentTarget.value })
            }
          />
        </div>
      )}
      <label className={styles.agree}>
        <input
          type="checkbox"
          checked={state.consent}
          disabled={busy || coding}
          onChange={(event) =>
            send({ type: "consent", consent: event.currentTarget.checked })
          }
        />
        <span>
          I agree to the <Link href="/terms/">Terms</Link> and{" "}
          <Link href="/privacy/">Privacy policy</Link>. This is information, not
          migration advice.
        </span>
      </label>
      {props.siteKey && !(state.order && !coding) && (
        <Turnstile
          key={props.turnstileKey}
          siteKey={props.siteKey}
          action="report"
          onToken={(token) => send({ type: "turnstile", token })}
        />
      )}
      {view.kind === "quoted" ? (
        <Ticket
          variant="ink"
          type="submit"
          stub={view.ticket.stub}
          title={view.ticket.title}
          sub={view.ticket.sub}
          busy={busy}
        />
      ) : (
        <span className={styles.ticketSkeleton} aria-hidden="true" />
      )}
      {message && (
        <p className={styles.message} role="alert">
          {message}
        </p>
      )}
      {quoteMissing && state.error && (
        <button
          type="button"
          className={styles.retry}
          onClick={props.onRetryQuote}
        >
          Try again
        </button>
      )}
    </form>
  );
}
