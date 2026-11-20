import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/feedback-form";
export const metadata: Metadata = {
  title: "Help shape MigrateLens",
  description:
    "Share a suggestion, report a problem, or tell us what you would like to see next in MigrateLens.",
  alternates: { canonical: "/feedback/" },
};
export default function FeedbackPage() {
  return (
    <main id="main" className="container">
      <header className="page-head">
        <h1>Help shape MigrateLens</h1>
        <p>
          What worked, what needs improving, and what would you like to see
          next? We welcome your suggestions, feedback and ideas.
        </p>
      </header>
      <FeedbackForm />
    </main>
  );
}
