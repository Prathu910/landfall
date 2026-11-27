import { RotateCcw } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL_PAGES } from "@/lib/legal/copy";
import { legalMetadata } from "@/lib/legal/meta";

export const metadata = legalMetadata("refunds");

export default function RefundsPage() {
  return <LegalPage page={LEGAL_PAGES.refunds} icon={RotateCcw} />;
}
