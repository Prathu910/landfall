import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FormTheme } from "@/components/forms/form-theme-provider";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
export const metadata: Metadata = {
  title: "Help shape MigrateLens",
  description:
    "Share a suggestion, report a problem, or tell us what you would like to see next in MigrateLens.",
  alternates: { canonical: "/feedback/" },
};
export default function FeedbackPage() {
  return (
    <main id="main" className={shell.page}>
      <div className={shell.inner}>
        <PageHead
          crumb="Feedback"
          eyebrow="Feedback"
          icon={MessageSquareText}
          title="Help shape MigrateLens"
          intro="What worked, what needs improving, and what would you like to see next? We welcome your suggestions, feedback and ideas."
        />
        <FormTheme>
          <FeedbackForm />
        </FormTheme>
      </div>
    </main>
  );
}
