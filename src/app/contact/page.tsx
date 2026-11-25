import { Mail } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_PAGES } from "@/lib/legal/copy";
import { legalMetadata } from "@/lib/legal/meta";

export const metadata = legalMetadata("contact");

export default function ContactPage() {
  return <LegalPage page={LEGAL_PAGES.contact} icon={Mail} />;
}
