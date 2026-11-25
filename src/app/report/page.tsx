import type { Metadata } from "next";
import { IssuedReport } from "@/components/issued/issued-report";
import styles from "./report-page.module.css";

/**
 * The issued report: a static shell that reads the link token from the hash.
 * Private: noindex, left out of the sitemap and disallowed in robots.txt.
 */
export const metadata: Metadata = {
  title: "Your PR report",
  description: "Your personal Australian PR report, issued from your answers.",
  robots: { index: false, follow: false },
};

export default function ReportPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <IssuedReport />
      </div>
    </main>
  );
}
