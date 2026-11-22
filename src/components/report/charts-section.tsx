import type { ReportOutlookView } from "@/lib/outlook/view";
import { CutoffColumns } from "./cutoff-columns";
import { QueueSquares } from "./queue-squares";
import section from "./section.module.css";

/** "Last 6 cut-offs" beside "Who's in the queue"; each has a dashed empty state. */
export function ChartsSection({ view }: { view: ReportOutlookView }) {
  return (
    <section id="charts" className={section.band}>
      <div className={section.two}>
        <div>
          <h2 className={section.h3}>Last 6 cut-offs</h2>
          <p className={section.sub}>189 rounds for your occupation.</p>
          {view.cutoffs ? (
            <CutoffColumns data={view.cutoffs} />
          ) : (
            <p className={section.empty}>{view.cutoffsEmpty}</p>
          )}
        </div>
        <div>
          <h2 className={section.h3}>
            {view.queue?.title ?? "Who's in the queue"}
          </h2>
          <p className={section.sub}>EOIs in the 189 pool, by points.</p>
          {view.queue ? (
            <QueueSquares data={view.queue} />
          ) : (
            <p className={section.empty}>{view.queueEmpty}</p>
          )}
        </div>
      </div>
    </section>
  );
}
