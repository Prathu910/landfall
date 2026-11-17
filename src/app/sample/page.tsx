import { Report } from "@/components/report";
import { sampleProfile } from "@/lib/migration";
export const metadata = { title: "Explore the sample report" };
export default function SamplePage() {
  const profile = {
    ...sampleProfile,
    onshore: true,
    state: "VIC",
    visaExpiry: "2027-09-30",
    assessmentDate: "2026-02-20",
    assessmentExpiry: "2029-02-20",
    eoiDate: "2026-03-14",
  };
  return (
    <main id="main" className="container">
      <div className="page-head">
        <span className="eyebrow">See what clarity looks like</span>
        <h1>
          One person.
          <br />
          <em>Their whole picture.</em>
        </h1>
        <p>
          Aarav is fictional. The points calculations and official occupation
          snapshot are real. Your own overview uses your answers.
        </p>
      </div>
      <Report profile={profile} asOf="2026-11-17" sample />
    </main>
  );
}
