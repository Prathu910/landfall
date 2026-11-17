import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CheckFlow } from "@/components/check-flow";
import { loadManifest } from "@/lib/data/load-server";
import { reportSource } from "@/lib/data/report-source";
export const metadata = { title: "Your free points check" };
export default function CheckPage() {
  // Every occupation file shares the manifest's as-at month.
  const manifest = loadManifest();
  return (
    <main id="main" className="container">
      <div className="page-head">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={12} />
          <span>Your points check</span>
        </div>
        <span className="eyebrow">A little context. A clearer picture.</span>
        <h1>
          Start with <em>your points.</em>
        </h1>
        <p>
          Understand what counts, see the dates that matter, and compare your
          score with published occupation data. Free, with no account needed.
        </p>
      </div>
      <CheckFlow source={reportSource(manifest.asAt, manifest)} />
    </main>
  );
}
