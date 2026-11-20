"use client";
import { useRef, useState } from "react";
import type {
  CalculationSubmission,
  FeedbackSubmission,
} from "@/lib/submissions/contract";
import type { SubmissionConfig } from "./config";
import { sendSubmission } from "./transport";
type Draft = Omit<CalculationSubmission, "id"> | Omit<FeedbackSubmission, "id">;
/** Retry identity stays in memory only, and never outlives this form. */
export function useSubmission(kind: "calculation" | "feedback") {
  const lock = useRef(false);
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(
    draft: Draft,
    token: string,
    config: SubmissionConfig | null,
  ): Promise<boolean> {
    if (lock.current) return false;
    if (!config) {
      setError(
        "Submissions are not available yet. Your answers are still here; please try again later.",
      );
      return false;
    }
    lock.current = true;
    setPending(true);
    setError("");
    try {
      const fingerprint = JSON.stringify(draft);
      if (!attempt.current || attempt.current.fingerprint !== fingerprint)
        attempt.current = { fingerprint, id: crypto.randomUUID() };
      await sendSubmission(
        kind,
        { ...draft, id: attempt.current.id },
        token,
        config,
      );
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Saving failed. Please try again.",
      );
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return {
    submit,
    pending,
    error,
    clearError: () => setError(""),
    reset: () => {
      attempt.current = null;
      setError("");
    },
  };
}
