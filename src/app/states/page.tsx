import { StateExplorer } from "@/components/state-explorer";
export const metadata = { title: "State and territory pathways" };
export default function StatesPage() {
  return (
    <main id="main" className="container">
      <div className="page-head">
        <h1>State and territory nomination programs</h1>
        <p>
          Federal points are one part. Each state and territory has its own
          criteria, priorities and selection process for nomination.
        </p>
      </div>
      <StateExplorer />
    </main>
  );
}
