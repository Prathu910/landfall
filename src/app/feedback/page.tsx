import type { Metadata } from "next";
import { MessageSquareText } from "lucide-react";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { FormTheme } from "@/components/forms/form-theme-provider";
import shell from "@/components/info-page/info-page.module.css";
import { PageHead } from "@/components/info-page/page-head";
import { sitePageMetadata } from "@/lib/seo/page-meta";
import { FEEDBACK_PAGE } from "@/lib/seo/site-pages";
export const metadata: Metadata = sitePageMetadata(FEEDBACK_PAGE);
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
