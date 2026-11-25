"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./receipt.module.css";

const RESEND_AFTER_S = 60;

type Props = {
  hint: string;
  code: string;
  /** Changes with every code sent, to restart the resend wait. */
  claimId: string;
  busy: boolean;
  onCode: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
};

/** Replaces the email row once a founding code is sent. */
export function CodeEntry(props: Props) {
  const { hint, code, claimId, busy } = props;
  const id = useId();
  const field = useRef<HTMLInputElement>(null);
  const [wait, setWait] = useState(RESEND_AFTER_S);
  useEffect(() => {
    field.current?.focus();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new code restarts the resend wait
    setWait(RESEND_AFTER_S);
    const timer = window.setInterval(
      () => setWait((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [claimId]);
  return (
    <div className={styles.codeRow}>
      <label className={styles.label} htmlFor={id}>
        We&apos;ve sent a code to {hint}
      </label>
      <input
        ref={field}
        id={id}
        className={`${styles.input} ${styles.code}`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="6-digit code"
        value={code}
        disabled={busy}
        onChange={(event) => props.onCode(event.currentTarget.value)}
      />
      <p className={styles.codeActions}>
        {wait > 0 ? (
          <span aria-live="off">You can ask for a new code in {wait} s.</span>
        ) : (
          <button
            type="button"
            className={styles.textButton}
            onClick={props.onResend}
            disabled={busy}
          >
            Resend code
          </button>
        )}
        <button
          type="button"
          className={styles.textButton}
          onClick={props.onChangeEmail}
          disabled={busy}
        >
          Use a different email
        </button>
      </p>
    </div>
  );
}
