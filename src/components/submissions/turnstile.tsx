"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./submissions.module.css";
type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
let loading: Promise<TurnstileApi> | undefined;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timer = window.setTimeout(() => {
      script.remove();
      loading = undefined;
      reject(new Error("timeout"));
    }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      if (window.turnstile) resolve(window.turnstile);
      else {
        loading = undefined;
        reject(new Error("unavailable"));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error("unavailable"));
    };
    document.head.appendChild(script);
  });
  return loading;
}
export function Turnstile({
  siteKey,
  action,
  onToken,
}: {
  siteKey: string;
  action: "calculation" | "feedback";
  onToken: (token: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  useEffect(() => {
    let cancelled = false;
    let widget: string | undefined;
    let api: TurnstileApi | undefined;
    const failed = () => {
      callback.current("");
      setError(
        "Spam verification could not finish. Check your connection or retry.",
      );
    };
    loadTurnstile()
      .then((client) => {
        if (cancelled || !element.current) return;
        api = client;
        widget = client.render(element.current, {
          sitekey: siteKey,
          action,
          theme: "light",
          size: "flexible",
          callback: (token: string) => {
            setError("");
            callback.current(token);
          },
          "expired-callback": () => {
            callback.current("");
            setError("Verification expired. Please retry verification.");
          },
          "error-callback": () => {
            failed();
            return true;
          },
        });
      })
      .catch(() => {
        if (!cancelled) failed();
      });
    return () => {
      cancelled = true;
      if (widget && api) api.remove(widget);
    };
  }, [siteKey, action, generation]);
  return (
    <div className={styles.verification}>
      <div ref={element} aria-label="Spam verification" />
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              onToken("");
              setGeneration((n) => n + 1);
            }}
          >
            Retry verification
          </button>
        </div>
      )}
    </div>
  );
}
