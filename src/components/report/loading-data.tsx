/** Shown while an occupation's published data file loads; never the "not in snapshot" message. */
export function LoadingData() {
  return (
    <div className="report-empty" role="status">
      Loading published data…
    </div>
  );
}
