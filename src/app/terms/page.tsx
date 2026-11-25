import { ScrollText } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_PAGES } from "@/lib/legal/copy";
import { legalMetadata } from "@/lib/legal/meta";

export const metadata = legalMetadata("terms");

export default function TermsPage() {
  return <LegalPage page={LEGAL_PAGES.terms} icon={ScrollText} />;
}
