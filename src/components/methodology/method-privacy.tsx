import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import styles from "./methodology.module.css";

/** Other pages link to #privacy; the full text is the privacy policy. */
export function MethodPrivacy() {
  return (
    <section id="privacy" className={`${styles.section} ${styles.privacy}`}>
      <ShieldCheck className={styles.privacyMark} size={22} aria-hidden />
      <h2>Your information and privacy</h2>
      <p>
        Your full profile and points calculation stay in your browser. The free
        result is calculated on your device and sends us nothing.
      </p>
      <p>
        What we collect when you claim or buy a report or send feedback, who
        processes it for us and how long we keep it are in our{" "}
        <Link href="/privacy/">privacy policy</Link>.
      </p>
    </section>
  );
}
