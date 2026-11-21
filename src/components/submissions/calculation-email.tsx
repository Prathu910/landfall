"use client";
import Link from "next/link";
import { Alert, TextInput } from "@mantine/core";
import { Turnstile } from "./turnstile";
import { readEnabled } from "./config";
import type { SubmissionConfig } from "./config";
import styles from "./submissions.module.css";
export function CalculationEmail({
  email,
  onEmail,
  error,
  config,
  generation,
  onToken,
}: {
  email: string;
  onEmail: (value: string) => void;
  error: string;
  config: SubmissionConfig | null;
  generation: number;
  onToken: (token: string) => void;
}) {
  return (
    <section className={styles.box} aria-label="Email for your report">
      <h2>View your free report</h2>
      <p>
        Enter your email to view your report. We save your email, occupation,
        age band, whether you are in Australia, and points summary to understand
        how MigrateLens is used. Your full answers stay in your browser.
        {readEnabled &&
          " Your summary is written by AI from your results (not your answers)."}
      </p>
      <TextInput
        id="report-email"
        label="Email address"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => onEmail(e.currentTarget.value)}
        error={error || undefined}
        size="md"
      />
      <p>
        We won’t send updates or marketing without a separate opt-in.{" "}
        <Link href="/methodology/#privacy">How we use your information</Link>.
      </p>
      {config ? (
        <Turnstile
          key={generation}
          siteKey={config.siteKey}
          action="calculation"
          onToken={onToken}
        />
      ) : (
        <Alert color="ink">
          Personal report submissions are not available yet. Your answers are
          still here. You can explore the public sample report while setup is
          completed.
        </Alert>
      )}
    </section>
  );
}
