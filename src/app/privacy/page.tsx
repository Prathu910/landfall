import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/legal/legal-page";
import { readEnabled } from "@/components/submissions/config";
import { legalMetadata, privacyPage } from "@/lib/legal/meta";

export const metadata = legalMetadata("privacy");

export default function PrivacyPage() {
  return <LegalPage page={privacyPage(readEnabled)} icon={ShieldCheck} />;
}
