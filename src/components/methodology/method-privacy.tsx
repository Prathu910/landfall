import { ShieldCheck } from "lucide-react";
import { readEnabled } from "@/components/submissions/config";
import { PrivacyContact } from "@/components/submissions/privacy-contact";
import styles from "./methodology.module.css";

/** The collection notice: wording is reviewed text, so change layout only. */
export function MethodPrivacy() {
  return (
    <section id="privacy" className={`${styles.section} ${styles.privacy}`}>
      <ShieldCheck className={styles.privacyMark} size={22} aria-hidden />
      <h2>Your information and privacy</h2>
      <p>
        Your full profile and points calculation stay in your browser. To view
        your personal report, you submit an email and a limited calculation
        summary: occupation, age band, whether you are in Australia, points
        totals, and the SkillSelect snapshot used. We store these with a
        submission date to understand usage. Your name, birth date, credential
        dates, visa expiry, documents and full answers are not sent with that
        submission. The public sample report does not require email.
      </p>
      <p>
        We use Supabase to process and store submissions, and Cloudflare
        Turnstile to reduce spam. Entering an email does not verify its
        ownership, create an account, subscribe you to updates or marketing, or
        send an emailed report.
      </p>
      {readEnabled && (
        <p>
          When the AI-written summary is on, your computed results (not your
          answers, name, email or date of birth) are sent to Anthropic to write
          your summary. MigrateLens does not store them.
        </p>
      )}
      <p>
        Feedback stores your message and category, plus an email and calculation
        summary only if you choose to include them. Please do not include
        documents or sensitive identifiers. We may use an optional feedback
        email to respond to that message.
      </p>
      <p>
        We delete submitted calculations and feedback 180 days after they are
        submitted. Deletion from backup copies follows the hosting provider’s
        backup retention. Access is restricted to the site operator and the
        services that process submissions. Hosting and security services may
        also process connection information and keep ordinary access logs. We
        use Cloudflare Web Analytics, which counts page visits without cookies
        and without identifying you.
      </p>
      <p>
        Your full answers are held in memory unless you enable “Save my progress
        on this device”. That option uses browser local storage and excludes
        your report email. Anyone using the same browser may see locally saved
        answers. “Clear my answers” removes the browser copy. An optional
        feedback-summary handoff uses session storage for up to 15 minutes and
        is removed when the feedback page reads it.
      </p>
      <PrivacyContact />
      <p>
        Printing or saving your report creates a copy under your control.
        External source links have their own privacy policies. Collection notice
        version: 20 November 2026.
      </p>
    </section>
  );
}
