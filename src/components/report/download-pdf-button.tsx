"use client";
import { Download } from "lucide-react";
import styles from "./download-pdf-button.module.css";

/** Opens the browser's print dialog, where the reader can save the PDF. */
export function DownloadPdfButton() {
  return (
    <button
      type="button"
      className={`${styles.button} no-print`}
      onClick={() => window.print()}
    >
      <Download size={16} aria-hidden="true" />
      Download PDF
    </button>
  );
}
