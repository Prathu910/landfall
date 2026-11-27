import { Send } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_PAGES } from "@/lib/legal/copy";
import { legalMetadata } from "@/lib/legal/meta";

export const metadata = legalMetadata("delivery");

export default function DeliveryPage() {
  return <LegalPage page={LEGAL_PAGES.delivery} icon={Send} />;
}
