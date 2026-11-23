import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Check, Globe2 } from "lucide-react";
import { CheckFlow } from "@/components/check-flow";
import { loadManifest } from "@/lib/data/load-server";
import { reportSource } from "@/lib/data/report-source";
import styles from "./check-page.module.css";

export const metadata: Metadata = {
  title: "Australian PR points calculator — your free check",
  description:
    "Calculate your Australian skilled migration points for the 189, 190 and provisional 491 pathways. Get a free personal report with published occupation evidence.",
  alternates: { canonical: "/check/" },
};
export default function CheckPage() {
  // Every occupation file shares the manifest's as-at month.
  const manifest = loadManifest();
  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={12} aria-hidden />
          <span aria-current="page">Your points check</span>
        </nav>
        <header className={styles.heading}>
          <div>
            <p className={styles.context}>
              <Globe2 size={16} aria-hidden /> Australian skilled migration
            </p>
            <h1>Your Australian PR picture.</h1>
          </div>
          <div>
            <p className={styles.description}>
              Start with your points. See what they mean for the 189, 190 and
              provisional 491 pathways in your free personal report.
            </p>
            <ul className={styles.facts}>
              {[
                "No account",
                "No documents to upload",
                "Email to view report",
              ].map((fact) => (
                <li key={fact}>
                  <Check size={14} aria-hidden />
                  {fact}
                </li>
              ))}
            </ul>
            <p className={styles.guideLink}>
              New to the process?{" "}
              <Link href="/guide/">Read the step-by-step PR guide</Link>
            </p>
          </div>
        </header>
        <CheckFlow source={reportSource(manifest.asAt, manifest)} />
      </div>
    </main>
  );
}
