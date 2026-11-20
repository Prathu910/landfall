"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  Checkbox,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import {
  FEEDBACK_CATEGORIES,
  PRIVACY_VERSION,
  validateFeedback,
  validEmail,
  feedbackLength,
  type CalculationSummary,
} from "@/lib/submissions/contract";
import {
  FEEDBACK_CONTEXT_KEY,
  readFeedbackContext,
} from "@/lib/submissions/feedback-context";
import { configuredSubmissions } from "../submissions/config";
import { useSubmission } from "../submissions/use-submission";
import { Turnstile } from "../submissions/turnstile";
import styles from "./feedback.module.css";
const labels = [
  "Suggestion",
  "Something is wrong",
  "Improvement",
  "Feature request",
  "Other",
];
export function FeedbackForm() {
  const consumed = useRef(false);
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [context, setContext] = useState<CalculationSummary | null>(null);
  const [include, setInclude] = useState(false);
  const [token, setToken] = useState("");
  const [generation, setGeneration] = useState(0);
  const [validation, setValidation] = useState("");
  const [sent, setSent] = useState(false);
  const request = useSubmission("feedback");
  const config = configuredSubmissions();
  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;
    try {
      const raw = sessionStorage.getItem(FEEDBACK_CONTEXT_KEY);
      sessionStorage.removeItem(FEEDBACK_CONTEXT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- consume optional browser-only handoff after hydration
      setContext(readFeedbackContext(raw, Date.now()));
    } catch {
      /* Feedback remains available with no report attachment. */
    }
  }, []);
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (request.pending) return;
    const draft = {
      category,
      message,
      email: email.trim() || null,
      summary: include ? context : null,
      privacy_version: PRIVACY_VERSION,
    };
    const checked = validateFeedback({
      ...draft,
      id: "00000000-0000-4000-8000-000000000000",
    });
    if (!checked.ok) {
      setValidation(checked.error);
      document
        .getElementById(
          !category
            ? "feedback-category"
            : feedbackLength(message) < 10 || feedbackLength(message) > 3000
              ? "feedback-message"
              : "feedback-email",
        )
        ?.focus();
      return;
    }
    setValidation("");
    const { id: _id, ...payload } = checked.value;
    void _id;
    if (await request.submit(payload, token, config)) {
      setSent(true);
      setMessage("");
      setEmail("");
      setCategory(null);
      setContext(null);
      setInclude(false);
    }
    setToken("");
    setGeneration((n) => n + 1);
  }
  if (sent)
    return (
      <section className={styles.success} role="status">
        <h2>Thank you for helping shape MigrateLens.</h2>
        <p>
          Your feedback has been saved. If you left an email, we may contact you
          about this message.
        </p>
        <Button
          type="button"
          color="ink"
          onClick={() => {
            request.reset();
            setSent(false);
          }}
        >
          Send more feedback
        </Button>
        <Link href="/">Back to MigrateLens</Link>
      </section>
    );
  return (
    <form
      onSubmit={send}
      noValidate
      aria-busy={request.pending}
      className={styles.form}
    >
      <fieldset disabled={request.pending}>
        <Select
          id="feedback-category"
          label="What would you like to share?"
          required
          value={category}
          onChange={setCategory}
          data={FEEDBACK_CATEGORIES.map((value, index) => ({
            value,
            label: labels[index],
          }))}
          placeholder="Choose a category"
          size="md"
          error={validation && !category ? "Choose a category." : undefined}
        />
        <Textarea
          id="feedback-message"
          label="Your feedback"
          required
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          minRows={6}
          maxLength={6000}
          description="What worked, what needs improving, and what would you like to see next? 10–3,000 characters."
          size="md"
          error={
            validation &&
            (feedbackLength(message) < 10 || feedbackLength(message) > 3000)
              ? "Write between 10 and 3,000 characters."
              : undefined
          }
        />
        <TextInput
          error={
            validation && email.trim() && !validEmail(email)
              ? "Enter a valid email address, or leave this field blank."
              : undefined
          }
          id="feedback-email"
          label="Email address (optional)"
          description="Leave your email if you would like a reply."
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          size="md"
        />
        {context && (
          <Checkbox
            label="Include my occupation and points summary"
            checked={include}
            onChange={(e) => setInclude(e.currentTarget.checked)}
            description={`Occupation ${context.occupation_code}; ${context.base_points} base points, ${context.points_190} with 190 nomination, ${context.points_491} with 491 nomination; age band ${context.age_band}; ${context.location}; snapshot ${context.snapshot_id}. Your report email and full answers are not attached.`}
          />
        )}
        <p>
          Please don’t include passport numbers, documents, or other sensitive
          details. We store your message and any email or summary you choose to
          include. We won’t subscribe you to marketing.{" "}
          <Link href="/methodology/#privacy">Privacy and deletion</Link>.
        </p>
        {config ? (
          <Turnstile
            key={generation}
            siteKey={config.siteKey}
            action="feedback"
            onToken={setToken}
          />
        ) : (
          <Alert color="ink">
            Feedback submissions are not available yet. Your message will stay
            here while this page remains open; please try again later.
          </Alert>
        )}
        {(validation || request.error) && (
          <Alert role="alert" color="red">
            {validation || request.error}
          </Alert>
        )}
        <Button type="submit" size="md" color="ink" loading={request.pending}>
          Send feedback
        </Button>
      </fieldset>
    </form>
  );
}
